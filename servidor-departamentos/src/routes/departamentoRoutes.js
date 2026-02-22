const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');

router.post('/', departamentoController.crearDepartamento);
router.get('/', departamentoController.listarDepartamentos);
router.get('/:id', departamentoController.obtenerDepartamentoPorId);

module.exports = router;
