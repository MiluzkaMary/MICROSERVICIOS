/**
 * Rutas de Departamentos
 * Endpoints de la API
 */
const express = require('express');
const router = express.Router();
const departamentoController = require('../controllers/departamentoController');
const { requiereAuth, requiereAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /departamentos:
 *   post:
 *     tags:
 *       - Departamentos
 *     summary: Crear un nuevo departamento
 *     description: |
 *       Crea un nuevo departamento en el sistema.
 *       
 *       **Validaciones:**
 *       - El nombre es requerido
 *       - El nombre debe ser único (previene duplicados)
 *       - La descripción es opcional
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartamentoInput'
 *           examples:
 *             ejemplo1:
 *               summary: Departamento de Tecnología
 *               value:
 *                 nombre: "Tecnología"
 *                 descripcion: "Departamento de desarrollo de software e infraestructura"
 *             ejemplo2:
 *               summary: Departamento de Recursos Humanos
 *               value:
 *                 nombre: "Recursos Humanos"
 *                 descripcion: "Gestión de personal y nómina"
 *             ejemplo3:
 *               summary: Solo nombre (sin descripción)
 *               value:
 *                 nombre: "Ventas"
 *     responses:
 *       201:
 *         description: Departamento creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Departamento'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: No autenticado o token inválido
 *       403:
 *         description: Requiere permisos de administrador
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', requiereAuth, requiereAdmin, (req, res) => departamentoController.crear(req, res));

/**
 * @swagger
 * /departamentos/{id}:
 *   get:
 *     tags:
 *       - Departamentos
 *     summary: Obtener un departamento por ID
 *     description: |
 *       Busca y retorna un departamento específico por su identificador único.
 *       
 *       Este endpoint es usado por el servicio de empleados para validar la existencia
 *       de un departamento antes de crear un empleado.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID único del departamento
 *         example: 1
 *     responses:
 *       201:
 *         description: Departamento encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Departamento'
 *       401:
 *         description: No autenticado o token inválido
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', requiereAuth, (req, res) => departamentoController.obtenerPorId(req, res));

/**
 * @swagger
 * /departamentos:
 *   get:
 *     tags:
 *       - Departamentos
 *     summary: Listar departamentos con paginación
 *     description: |
 *       Obtiene una lista paginada de departamentos con soporte para filtrado y ordenamiento.
 *       
 *       **Características:**
 *       - Paginación configurable
 *       - Filtrado por nombre
 *       - Búsqueda general con parámetro 'q'
 *       - Ordenamiento por cualquier campo
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, nombre, descripcion]
 *           default: id
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Dirección del ordenamiento
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda general (nombre, descripción)
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre (búsqueda parcial)
 *     responses:
 *       201:
 *         description: Lista de departamentos paginada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DepartamentoPaginado'
 *       401:
 *         description: No autenticado o token inválido
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', requiereAuth, (req, res) => departamentoController.obtenerTodos(req, res));

module.exports = router;
