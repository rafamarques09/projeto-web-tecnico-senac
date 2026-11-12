import express from "express";
import controller from "../controllers/solicitacoesController.js";
import {autenticacaoMiddleware} from "../middlewares/autenticacaoMiddleware.js";
import {autorizacaoMiddleware} from "../middlewares/autorizacaoMiddleware.js";

const router = express.Router();

router.use(autenticacaoMiddleware);
router.get('/', controller.listarSolicitacoes);                                  
router.post('/', autorizacaoMiddleware('TUTOR'), controller.criarSolicitacao);
router.put('/:id/status', controller.atualizarStatusSolicitacao);   
router.delete('/:id', autorizacaoMiddleware('TUTOR', 'ADMIN'), controller.removerSolicitacao);

export default router;