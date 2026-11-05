import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {pool} from "../database/conexao.js";

function emailValido(email){
    return typeof email === 'string' && email.length <= 180 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function cadastrar(req, res, next) {
    try {
        const {nome, email, senha, cpf, telefone} = req.body;
        if (typeof nome !=='string' || nome.trim().length < 2 || nome.trim().length > 100 || 
            !emailValido(email) ||
            typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
                return res.status(400).json({
                    message: 'Informe nome (2 a 100 caracteres), e-mail válido e senha com no mínimo 8 caracteres.'
                });
            }
        
        let cpfLimpo = null;
        if (cpf !== undefined && cpf !== null & String(cpf).trim() != ''){
            cpfLimpo = String(cpf).replace(/\D/g, '');
            if (cpfLimpo.length !== 11){
                return res.status(400).json({
                    message:'CPF deve ter 11 digitos.'
                });
            }
        }
        const telefoneLimpo = typeof telefone === 'string' && telefone.trim() ? telefone.trim().slice(0,20) : null;

        const senhaProtegida = await bcrypt.hash(senha, 10);

        const [resultado] = await pool.execute("INSERT INTO usuarios (nome, email, senha, cpf, telefone, perfil) VALUES (?, ?, ?, ?, ?, 'TUTOR')",
            [nome.trim(), email.trim().toLowerCase(), senhaProtegida, cpfLimpo, telefoneLimpo]
        );
        return res.status(201).json({
            message:'Cadastro realizado com sucesso.'
        })
    } catch (erro) {
        if (erro.code === 'ER_DUP_ENTRY'){
            return res.status(409).json({
                message: 'E-mail ou CPF já cadastrado.'
            });
        }
        next(erro);
    }
}

async function login(req,res,next) {
    try {
        const {email, senha} = req.body;

        if (!emailValido(email) ||
            typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
                return res.status(400).json({
                    message: 'Informe e-mail válido e senha válidos.'
                });
        }

        const [usuarios] = await pool.execute("SELECT * FROM usuarios WHERE email = ?",[email.trim().toLowerCase()]);

        if (usuarios.length === 0 || !(await bcrypt.compare(senha, usuarios[0].senha))) {
            return res.status(401).json({
                message: 'E-mail ou senha incorretos.'
            });
        }

        const {id, nome, perfil} = usuarios[0];

        const token = jwt.sign({id,perfil}, process.env.JWT_SECRET, {
            algorithm:'HS256',
            expiresIn: process.env.JWT_EXPIRES_IN || '2h'
        });

        return res.status(200).json({
            message:'Login realizado com sucesso.',
            token,
            usuario: {id, nome, email: usuarios[0].email, perfil}
        });

    } catch (erro) {
        next(erro)
    }
}

function perfil(req,res){
    res.status(200).json({usuario:req.usuario});
}
export default {cadastrar, login, perfil};