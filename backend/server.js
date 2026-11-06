import path from "path";
import { pool, testarConexao } from "./database/conexao.js";
import express from "express";
import corsMiddleware from "./middlewares/corsMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import usuariosRoutes from "./routes/usuariosRoutes.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(corsMiddleware);
app.use(express.json({limit:'100kb'}));

app.use('/auth', authRoutes);
app.use('/usuarios', usuariosRoutes);

app.use((req,res)=> res.status(404).json({message:'Rota não encontrada.'}));

app.use((erro, req,res,next)=>{
    if(res.headersSent) return next(erro);
    if(erro.type === 'entity.parse.failed') return res.status(400).json({message:'O JSON enviado é inválido'});
    console.error('Erro na API: ',erro.code || erro.message);
    res.status(500).json({message:'Não foi possível concluir a operação. Tente novamente.'});
});

async function iniciarServidor() {
    try {
        if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32){
            throw new Error('Configure JWT_SECRET com ao menos 32 caracteres no backend/.env');
        }
        await testarConexao()
        app.listen(PORT, ()=>console.log(`Servidor rodando em http://localhost:${PORT}`));
    } catch (erro) {
        console.error("Falha ao iniciar servidor: ", erro.code || erro.message)
        await pool.end()
        process.exitCode = 1;
    }
}
iniciarServidor();

export default app;