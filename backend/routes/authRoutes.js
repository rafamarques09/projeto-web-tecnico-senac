import express from "express";
import controller from "../controllers/authController.js";
import {autenticacaoMiddleware} from "../middlewares/autenticacaoMiddleware.js";

const router = express.Router();

router.post('/cadastro', controller.cadastrar);
router.post('/login', controller.login);
router.get('/perfil', autenticacaoMiddleware, controller.perfil);

export default router;