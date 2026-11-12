import express from "express";
import controller from "../controllers/animaisController.js";
import {autenticacaoMiddleware} from "../middlewares/autenticacaoMiddleware.js";
import {autorizacaoMiddleware} from "../middlewares/autorizacaoMiddleware.js";

const router = express.Router();

router.use(autenticacaoMiddleware);
router.get('/', autorizacaoMiddleware('TUTOR', 'ADMIN'), controller.listarAnimais);
router.post('/', autorizacaoMiddleware('TUTOR'), controller.criarAnimal);
router.put('/:id', autorizacaoMiddleware('TUTOR'), controller.atualizarAnimal);
router.delete('/:id', autorizacaoMiddleware('TUTOR'), controller.removerAnimal);

export default router;