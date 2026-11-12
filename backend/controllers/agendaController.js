import {pool} from "../database/conexao.js";

const OCUPAM_VAGA = "('PENDENTE', 'APROVADO', 'CHECKIN', 'CONCLUIDO')";

function hojeISO() {
    return new Date().toLocaleDateString('sv-SE');
}

function dataValida(data) {
    if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
    const d = new Date(data + 'T00:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === data;
}

const horarioValido = (h) => typeof h === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(h);
const vagasValidas = (v) => Number.isInteger(v) && v >= 1 && v <= 100;

async function listarAgenda(req, res, next) {
    try {
        const filtro = req.usuario.perfil === 'TUTOR' ? 'WHERE a.ativa = TRUE AND a.data >= CURDATE()' : '';
        const [horarios] = await pool.execute(
            `SELECT a.id, a.data, TIME_FORMAT(a.horario, '%H:%i') AS horario, a.vagas, a.ativa,
                    CAST(a.vagas AS SIGNED) - COUNT(s.id) AS vagas_restantes
             FROM agenda a
             LEFT JOIN solicitacoes s ON s.agenda_id = a.id AND s.status IN ${OCUPAM_VAGA}
             ${filtro}
             GROUP BY a.id
             ORDER BY a.data, a.horario`
        );
        res.json(horarios);
    } catch (erro) {
        next(erro);
    }
}

async function criarAgenda(req, res, next) {
    try {
        const { data, horario, vagas, ativa } = req.body;
        if (!dataValida(data) || !horarioValido(horario) || !vagasValidas(vagas) ||
            (ativa !== undefined && typeof ativa !== 'boolean')) {
            return res.status(400).json({ mensagem: 'Informe data, horário (HH:MM) e vagas (1 a 100) válidos.' });
        }
        if (data < hojeISO()) {
            return res.status(400).json({ mensagem: 'A data não pode estar no passado.' });
        }
        const [r] = await pool.execute(
            'INSERT INTO agenda (data, horario, vagas, ativa) VALUES (?, ?, ?, ?)',
            [data, horario + ':00', vagas, ativa === undefined ? true : ativa]
        );
        res.status(201).json({ mensagem: 'Horário cadastrado na agenda.', id: r.insertId });
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensagem: 'Já existe um horário cadastrado para esta data e hora.' });
        }
        next(erro);
    }
}

async function atualizarAgenda(req, res, next) {
    try {
        const id = Number(req.params.id);
        const { data, horario, vagas, ativa } = req.body;
        if (!Number.isInteger(id) || id <= 0 || !dataValida(data) || !horarioValido(horario) ||
            !vagasValidas(vagas) || typeof ativa !== 'boolean') {
            return res.status(400).json({ mensagem: 'Informe data, horário (HH:MM), vagas (1 a 100) e situação válidos.' });
        }

        const [atual] = await pool.execute(
            "SELECT DATE_FORMAT(data, '%Y-%m-%d') AS data, TIME_FORMAT(horario, '%H:%i') AS horario FROM agenda WHERE id = ?",
            [id]
        );
        if (atual.length === 0) {
            return res.status(404).json({ mensagem: 'Horário não encontrado.' });
        }

        const [uso] = await pool.execute(
            `SELECT COUNT(*) AS total FROM solicitacoes WHERE agenda_id = ? AND status IN ${OCUPAM_VAGA}`, [id]
        );
        const ocupadas = uso[0].total;
        const mudouDataHora = atual[0].data !== data || atual[0].horario !== horario;

        if (mudouDataHora && ocupadas > 0) {
            return res.status(409).json({ mensagem: 'Este horário já tem solicitações: não é possível mudar a data ou a hora.' });
        }
        if (mudouDataHora && data < hojeISO()) {
            return res.status(400).json({ mensagem: 'A data não pode estar no passado.' });
        }
        if (vagas < ocupadas) {
            return res.status(409).json({ mensagem: 'Já existem ' + ocupadas + ' solicitações neste horário: as vagas não podem ser menos que isso.' });
        }

        await pool.execute(
            'UPDATE agenda SET data = ?, horario = ?, vagas = ?, ativa = ? WHERE id = ?',
            [data, horario + ':00', vagas, ativa, id]
        );
        res.json({ mensagem: 'Horário atualizado.' });
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensagem: 'Já existe um horário cadastrado para esta data e hora.' });
        }
        next(erro);
    }
}

async function removerAgenda(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: 'Horário inválido.' });
        }
        const [existe] = await pool.execute('SELECT id FROM agenda WHERE id = ?', [id]);
        if (existe.length === 0) {
            return res.status(404).json({ mensagem: 'Horário não encontrado.' });
        }
        const [uso] = await pool.execute('SELECT COUNT(*) AS total FROM solicitacoes WHERE agenda_id = ?', [id]);
        if (uso[0].total > 0) {
            return res.status(409).json({ mensagem: 'Este horário tem solicitações. Feche o horário em vez de excluir.' });
        }
        await pool.execute('DELETE FROM agenda WHERE id = ?', [id]);
        res.json({ mensagem: 'Horário excluído da agenda.' });
    } catch (erro) {
        next(erro);
    }
}

export default { listarAgenda, criarAgenda, atualizarAgenda, removerAgenda };