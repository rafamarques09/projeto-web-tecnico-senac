import jwt from "jsonwebtoken";
import {pool} from "../database/conexao.js"

async function autenticacaoMiddleware(req, res, next) {
    const [tipo, token] = (req.get('Authorization') || '').split(' ');
    if (tipo !== 'Bearer' || !token){
        return res.status(401).json({
            message:'Informe um token de autenticação.'
        });
    }
    let dados;
    try {
        dados = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ['HS256']});     
    } catch (error) {
        return res.status(401).json({
            message: 'Sessão expirada ou token inválido. Entre novamente.'
        });
    }

    try {
        const [usuarios] = await pool.execute("SELECT id, nome, email, perfil FROM usuarios WHERE id=?", [dados.id]);
        if(usuarios.length === 0 ){
            return res.status(401).json({
                message: 'Usuário não foi encontrado.'
            });
        }
        req.usuario = usuarios[0];
        next();
    } catch (erro) {
        next(erro);
    }
}

export {autenticacaoMiddleware};