/**
 * Rutas de Empleados
 * Endpoints de la API
 */
const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

// POST /empleados 
router.post('/', (req, res) => empleadoController.crear(req, res));

// GET /empleados/:id 
router.get('/:id', (req, res) => empleadoController.obtenerPorId(req, res));

// GET /empleados 
router.get('/', (req, res) => empleadoController.obtenerTodos(req, res));

module.exports = router;
