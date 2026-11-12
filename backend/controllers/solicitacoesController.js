import {pool} from "../database/conexao.js";

const STATUS = ['PENDENTE', 'APROVADO', 'RECUSADO', 'CHECKIN', 'CONCLUIDO', 'CANCELADO'];
const OCUPAM_VAGA = "('PENDENTE', 'APROVADO', 'CHECKIN', 'CONCLUIDO')";

const TRANSICOES = {
    ADMIN: { PENDENTE: ['APROVADO', 'RECUSADO'] },
    CLINICA: { APROVADO: ['CHECKIN'], CHECKIN: ['CONCLUIDO'] },
    TUTOR: { PENDENTE: ['CANCELADO'], APROVADO: ['CANCELADO'] }
};

const MENSAGENS = {
    APROVADO: 'Solicitação aprovada.',
    RECUSADO: 'Solicitação recusada.',
    CHECKIN: 'Check-in registrado.',
    CONCLUIDO: 'Atendimento concluído e microchip registrado.',
    CANCELADO: 'Solicitação cancelada. A vaga foi liberada.'
};


function regra(http, mensagem) {
    const erro = new Error(mensagem);
    erro.http = http;
    return erro;
}

function responderErro(erro, res, next) {
    if (erro.http) return res.status(erro.http).json({ mensagem: erro.message });
    if (erro.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ mensagem: 'Este número de microchip já está registrado em outro animal.' });
    }
    next(erro);
}

async function listarSolicitacoes(req, res, next) {
    try {
        const { status } = req.query;
        if (status !== undefined && !STATUS.includes(status)) {
            return res.status(400).json({ mensagem: 'Status inválido.' });
        }

        const condicoes = [];
        const parametros = [];
        if (req.usuario.perfil === 'TUTOR') {          
            condicoes.push('an.tutor_id = ?');
            parametros.push(req.usuario.id);
        }
        if (req.usuario.perfil === 'CLINICA') {        
            condicoes.push("s.status IN ('APROVADO', 'CHECKIN', 'CONCLUIDO')");
        }
        if (status) {
            condicoes.push('s.status = ?');
            parametros.push(status);
        }
        const where = condicoes.length > 0 ? 'WHERE ' + condicoes.join(' AND ') : '';

        const [solicitacoes] = await pool.execute(
            `SELECT s.id, s.status, s.cad_unico, s.observacoes, s.justificativa_recusa,
                    s.data_solicitacao, s.data_conclusao,
                    an.id AS animal_id, an.nome AS animal_nome, an.especie, an.microchip,
                    u.nome AS tutor_nome, u.telefone AS tutor_telefone,
                    ag.id AS agenda_id, ag.data, TIME_FORMAT(ag.horario, '%H:%i') AS horario
             FROM solicitacoes s
             JOIN animais an ON an.id = s.animal_id
             JOIN usuarios u ON u.id = an.tutor_id
             JOIN agenda ag ON ag.id = s.agenda_id
             ${where}
             ORDER BY ag.data, ag.horario, s.id`,
            parametros
        );
        res.json(solicitacoes);
    } catch (erro) {
        next(erro);
    }
}

async function criarSolicitacao(req, res, next) {
    let conexao;
    try {
        const { animal_id, agenda_id, cad_unico, observacoes } = req.body;
        if (!Number.isInteger(animal_id) || animal_id <= 0 || !Number.isInteger(agenda_id) || agenda_id <= 0) {
            return res.status(400).json({ mensagem: 'Selecione o animal e o horário.' });
        }
        const cad = typeof cad_unico === 'string' && cad_unico.trim() ? cad_unico.trim() : null;
        const obs = typeof observacoes === 'string' && observacoes.trim() ? observacoes.trim() : null;
        if ((cad && cad.length > 20) || (obs && obs.length > 500)) {
            return res.status(400).json({ mensagem: 'CadÚnico (até 20) ou observações (até 500 caracteres) muito longos.' });
        }

        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const [horarios] = await conexao.execute(
            'SELECT id, vagas, ativa, (data >= CURDATE()) AS futuro FROM agenda WHERE id = ? FOR UPDATE', [agenda_id]
        );
        if (horarios.length === 0) throw regra(404, 'Horário não encontrado.');
        if (!horarios[0].ativa || !horarios[0].futuro) throw regra(409, 'Este horário não está disponível.');

        const [animais] = await conexao.execute(
            'SELECT id, castrado FROM animais WHERE id = ? AND tutor_id = ?', [animal_id, req.usuario.id]
        );
        if (animais.length === 0) throw regra(404, 'Animal não encontrado.');
        if (animais[0].castrado) throw regra(409, 'Este animal já foi castrado.');


        const [abertas] = await conexao.execute(
            "SELECT id FROM solicitacoes WHERE animal_id = ? AND status IN ('PENDENTE', 'APROVADO', 'CHECKIN')", [animal_id]
        );
        if (abertas.length > 0) throw regra(409, 'Este animal já tem uma solicitação em andamento.');


        const [ocupadas] = await conexao.execute(
            `SELECT COUNT(*) AS total FROM solicitacoes WHERE agenda_id = ? AND status IN ${OCUPAM_VAGA}`, [agenda_id]
        );
        if (ocupadas[0].total >= horarios[0].vagas) throw regra(409, 'Não há mais vagas neste horário.');

        const [r] = await conexao.execute(
            'INSERT INTO solicitacoes (animal_id, agenda_id, cad_unico, observacoes) VALUES (?, ?, ?, ?)',
            [animal_id, agenda_id, cad, obs]
        );
        await conexao.commit();
        res.status(201).json({ mensagem: 'Solicitação enviada! Aguarde a análise da prefeitura.', id: r.insertId });
    } catch (erro) {
        if (conexao) await conexao.rollback();
        responderErro(erro, res, next);
    } finally {
        if (conexao) conexao.release();
    }
}

async function atualizarStatusSolicitacao(req, res, next) {
    let conexao;
    try {
        const id = Number(req.params.id);
        const { status: novo, justificativa, microchip } = req.body;
        if (!Number.isInteger(id) || id <= 0 || !STATUS.includes(novo)) {
            return res.status(400).json({ mensagem: 'Informe uma solicitação e um status válidos.' });
        }

        conexao = await pool.getConnection();
        await conexao.beginTransaction();

        const [linhas] = await conexao.execute(
            `SELECT s.id, s.status, s.animal_id, an.tutor_id
             FROM solicitacoes s JOIN animais an ON an.id = s.animal_id
             WHERE s.id = ? FOR UPDATE`, [id]
        );
        const perfil = req.usuario.perfil;
        if (linhas.length === 0 || (perfil === 'TUTOR' && linhas[0].tutor_id !== req.usuario.id)) {
            throw regra(404, 'Solicitação não encontrada.');
        }
        const atual = linhas[0];

        const regrasDoPerfil = TRANSICOES[perfil] || {};
        const statusQueOPerfilDefine = Object.values(regrasDoPerfil).flat();
        if (!statusQueOPerfilDefine.includes(novo)) {
            throw regra(403, 'Seu perfil não tem permissão para esta operação.');
        }
        if (!(regrasDoPerfil[atual.status] || []).includes(novo)) {
            throw regra(409, 'Não é possível mudar a solicitação de ' + atual.status + ' para ' + novo + '.');
        }

        if (novo === 'RECUSADO') {
            const motivo = typeof justificativa === 'string' ? justificativa.trim() : '';
            if (motivo.length < 5 || motivo.length > 255) {
                throw regra(400, 'Informe a justificativa da recusa (5 a 255 caracteres).');
            }
            await conexao.execute(
                'UPDATE solicitacoes SET status = ?, justificativa_recusa = ? WHERE id = ?', [novo, motivo, id]
            );
        } else if (novo === 'CONCLUIDO') {
            const chip = String(microchip || '').replace(/\D/g, '');
            if (!/^\d{15}$/.test(chip)) throw regra(400, 'O microchip deve ter 15 dígitos.');
            await conexao.execute(
                'UPDATE solicitacoes SET status = ?, data_conclusao = NOW() WHERE id = ?', [novo, id]
            );
            await conexao.execute(
                'UPDATE animais SET microchip = ?, castrado = TRUE WHERE id = ?', [chip, atual.animal_id]
            );
        } else {
            await conexao.execute('UPDATE solicitacoes SET status = ? WHERE id = ?', [novo, id]);
        }

        await conexao.commit();
        res.json({ mensagem: MENSAGENS[novo] });
    } catch (erro) {
        if (conexao) await conexao.rollback();
        responderErro(erro, res, next);
    } finally {
        if (conexao) conexao.release();
    }
}

async function removerSolicitacao(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensagem: 'Solicitação inválida.' });

        const [linhas] = await pool.execute(
            `SELECT s.id, s.status, an.tutor_id
             FROM solicitacoes s JOIN animais an ON an.id = s.animal_id WHERE s.id = ?`, [id]
        );
        if (linhas.length === 0 || (req.usuario.perfil === 'TUTOR' && linhas[0].tutor_id !== req.usuario.id)) {
            return res.status(404).json({ mensagem: 'Solicitação não encontrada.' });
        }
        if (!['PENDENTE', 'RECUSADO', 'CANCELADO'].includes(linhas[0].status)) {
            return res.status(409).json({ mensagem: 'Só é possível excluir solicitações pendentes, recusadas ou canceladas.' });
        }
        await pool.execute('DELETE FROM solicitacoes WHERE id = ?', [id]);
        res.json({ mensagem: 'Solicitação excluída.' });
    } catch (erro) {
        next(erro);
    }
}

export default { listarSolicitacoes, criarSolicitacao, atualizarStatusSolicitacao, removerSolicitacao };