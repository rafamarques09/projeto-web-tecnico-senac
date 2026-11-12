import {pool} from "../database/conexao.js";

const ESPECIES = ['CAO', 'GATO'];
const SEXOS = ['MACHO', 'FEMEA'];
const PORTES = ['PEQUENO', 'MEDIO', 'GRANDE'];

// Valida e limpa os dados do animal. Microchip e "castrado" NÃO vêm do tutor: só a clínica define.
function validarAnimal(corpo) {
    const { nome, especie, sexo, raca, porte, idade_meses } = corpo;
    if (typeof nome !== 'string' || nome.trim().length < 1 || nome.trim().length > 80) {
        return { erro: 'Informe o nome do animal (até 80 caracteres).' };
    }
    if (!ESPECIES.includes(especie)) return { erro: 'Espécie inválida.' };
    if (!SEXOS.includes(sexo)) return { erro: 'Sexo inválido.' };
    if (porte && !PORTES.includes(porte)) return { erro: 'Porte inválido.' };

    let idade = null;
    if (idade_meses !== undefined && idade_meses !== null && idade_meses !== '') {
        idade = Number(idade_meses);
        if (!Number.isInteger(idade) || idade < 0 || idade > 300) {
            return { erro: 'A idade deve ser um número de meses entre 0 e 300.' };
        }
    }
    return {
        dados: {
            nome: nome.trim(),
            especie,
            sexo,
            raca: typeof raca === 'string' && raca.trim() ? raca.trim().slice(0, 60) : null,
            porte: porte || null,
            idade
        }
    };
}

async function listarAnimais(req, res, next) {
    try {
        const ehAdmin = req.usuario.perfil === 'ADMIN';
        const [animais] = await pool.execute(
            `SELECT a.id, a.nome, a.especie, a.sexo, a.raca, a.porte, a.idade_meses,
                    a.microchip, a.castrado, u.nome AS tutor_nome
             FROM animais a
             JOIN usuarios u ON u.id = a.tutor_id
             ${ehAdmin ? '' : 'WHERE a.tutor_id = ?'}
             ORDER BY a.nome`,
            ehAdmin ? [] : [req.usuario.id]
        );
        res.json(animais);
    } catch (erro) {
        next(erro);
    }
}

async function criarAnimal(req, res, next) {
    try {
        const { erro, dados } = validarAnimal(req.body);
        if (erro) return res.status(400).json({ mensagem: erro });

        const [r] = await pool.execute(
            'INSERT INTO animais (tutor_id, nome, especie, sexo, raca, porte, idade_meses) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.usuario.id, dados.nome, dados.especie, dados.sexo, dados.raca, dados.porte, dados.idade]
        );
        res.status(201).json({ mensagem: 'Animal cadastrado.', id: r.insertId });
    } catch (erro) {
        next(erro);
    }
}

async function atualizarAnimal(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensagem: 'Animal inválido.' });
        const { erro, dados } = validarAnimal(req.body);
        if (erro) return res.status(400).json({ mensagem: erro });

        const [animal] = await pool.execute('SELECT id FROM animais WHERE id = ? AND tutor_id = ?', [id, req.usuario.id]);
        if (animal.length === 0) return res.status(404).json({ mensagem: 'Animal não encontrado.' });

        await pool.execute(
            'UPDATE animais SET nome = ?, especie = ?, sexo = ?, raca = ?, porte = ?, idade_meses = ? WHERE id = ?',
            [dados.nome, dados.especie, dados.sexo, dados.raca, dados.porte, dados.idade, id]
        );
        res.json({ mensagem: 'Animal atualizado.' });
    } catch (erro) {
        next(erro);
    }
}

async function removerAnimal(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ mensagem: 'Animal inválido.' });

        const [animal] = await pool.execute('SELECT id FROM animais WHERE id = ? AND tutor_id = ?', [id, req.usuario.id]);
        if (animal.length === 0) return res.status(404).json({ mensagem: 'Animal não encontrado.' });

        const [uso] = await pool.execute('SELECT COUNT(*) AS total FROM solicitacoes WHERE animal_id = ?', [id]);
        if (uso[0].total > 0) {
            return res.status(409).json({ mensagem: 'Este animal tem solicitações. Exclua as solicitações primeiro (animais já atendidos ficam no histórico).' });
        }
        await pool.execute('DELETE FROM animais WHERE id = ?', [id]);
        res.json({ mensagem: 'Animal excluído.' });
    } catch (erro) {
        next(erro);
    }
}

export default { listarAnimais, criarAnimal, atualizarAnimal, removerAnimal };