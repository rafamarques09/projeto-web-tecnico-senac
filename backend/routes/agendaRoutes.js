import express from "express";
import controller from "../controllers/agendaController.js";
import {autenticacaoMiddleware} from "../middlewares/autenticacaoMiddleware.js";
import {autorizacaoMiddleware} from "../middlewares/autorizacaoMiddleware.js";

const router = express.Router();

router.use(autenticacaoMiddleware);
router.get('/', controller.listarAgenda);                                  
router.post('/', autorizacaoMiddleware('CLINICA', 'ADMIN'), controller.criarAgenda);
router.put('/:id', autorizacaoMiddleware('CLINICA', 'ADMIN'), controller.atualizarAgenda);
router.delete('/:id', autorizacaoMiddleware('CLINICA', 'ADMIN'), controller.removerAgenda);

export default router;