/**
 * Rutas de Departamentos
 * Endpoints de la API
 */
const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');

// POST /departamentos 
router.post('/', (req, res) => departamentoController.crear(req, res));

// GET /departamentos/:id 
router.get('/:id', (req, res) => departamentoController.obtenerPorId(req, res));

// GET /departamentos 
router.get('/', (req, res) => departamentoController.obtenerTodos(req, res));

module.exports = router;
