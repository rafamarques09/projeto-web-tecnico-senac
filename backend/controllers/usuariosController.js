import {pool} from "../database/conexao.js";

const perfis = ['ADMIN','CLINICA', 'TUTOR'];

async function listar(req, res, next) {
    try {
        const [usuarios] = await pool.execute("SELECT id, nome, email, cpf, telefone, perfil, criado_em FROM usuarios ORDER BY id");
        res.status(200).json(usuarios);
    } catch (erro) {
        next(erro);
    }
}

async function alterarPerfil(req,res, next) {
    try {
        const id = Number(req.params.id);
        const{perfil} = req.body;

        if(!Number.isInteger(id) || id <= 0 || !perfis.includes(perfil)){
            return res.status(400).json({
                message:'Informe um usuário e um perfil válidos.'
            });
        }

        const [alvo] = await pool.execute("SELECT id, perfil FROM usuarios WHERE id = ?",[id]);
        if(alvo.length === 0 ){
            return res.status(404).json({
                message: 'Usuário não encontrado.'
            })
        }

        if(alvo[0].perfil === 'ADMIN' && perfil !== "ADMIN"){
            const [admins] = await pool.execute("SELECT COUNT(*) AS total FROM usuarios WHERE perfil = 'ADMIN'");
            if(admins[0].total <= 1){
                return res.status(409).json({
                    message:'Mantenha pelo menos um administrador no sistema.'
                });
            }
        }

        await pool.execute('UPDATE usuarios SET perfil = ? WHERE id =?',[perfil,id]);
        res.status(200).json({
            message:'Perfil atualizado com sucesso'
        })
    } catch (erro) {
        next(erro);
    }
}

export default {listar, alterarPerfil};