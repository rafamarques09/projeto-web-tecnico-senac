import express from "express";
import controller from "../controllers/usuariosController.js";
import {autenticacaoMiddleware} from "../middlewares/autenticacaoMiddleware.js";
import {autorizacaoMiddleware} from "../middlewares/autorizacaoMiddleware.js";


const router = express.Router();

router.use(autenticacaoMiddleware, autorizacaoMiddleware('ADMIN'));
router.get('/', controller.listar);
router.put('/:id/perfil', controller.alterarPerfil);

export default router;

