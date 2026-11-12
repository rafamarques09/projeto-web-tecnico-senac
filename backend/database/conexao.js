import mysql from "mysql2/promise";
import 'dotenv/config';

//Conexão com o banco de dados
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'castrapet',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    dateStrings: true 
});

//Teste de conexão com o banco de dados
async function testarConexao() {
    const conexao = await pool.getConnection();
    try {
        await pool.query("SELECT 1");
        console.log("Banco de dados conectado com sucesso");
    } catch (error) {
        console.error("Não foi possível conectar ao banco de dados");
        console.error(`Detalhes do erro: ${erro.message}`);
        process.exit(1);
    } finally {
        if (conexao) {
            conexao.release();
        }
    }
}
export { pool, testarConexao };



