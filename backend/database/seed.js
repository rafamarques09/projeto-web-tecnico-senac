import bcrypt from "bcryptjs"
import { pool } from "../database/conexao.js"

const contas = [
    { nome: 'Gestor Municipal', email: 'admin@castrapet.com', senha: 'Admin@123', perfil: 'ADMIN' },
    { nome: 'Clínica Amigo Fiel', email: 'clinica@castrapet.com', senha: 'Clinica@123', perfil: 'CLINICA' },
    { nome: 'Tutor Exemplo', email: 'tutor@castrapet.com', senha: 'Tutor@123', perfil: 'TUTOR' }
];

async function criarConta(conta) {
    const [existe] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', [conta.email]);
    if (existe.length > 0) return;
    const hash = await bcrypt.hash(conta.senha, 10);
    await pool.execute(
        'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
        [conta.nome, conta.email, hash, conta.perfil]
    );
}

async function main() {
    try {
        for (const conta of contas) {
            await criarConta(conta);
            console.log('OK:', conta.email, '(' + conta.perfil + ')');
        }
        console.log('Seed concluído.');
    } catch (erro) {
        console.error('Falha no seed:', erro.code || erro.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();