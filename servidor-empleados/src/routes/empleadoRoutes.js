/**
 * Rutas de Empleados
 * Endpoints de la API
 */
const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

/**
 * @swagger
 * /empleados:
 *   post:
 *     tags:
 *       - Empleados
 *     summary: Crear un nuevo empleado
 *     description: |
 *       Crea un nuevo empleado en el sistema.
 *       
 *       **Importante:** Este endpoint valida que el departamento exista mediante una 
 *       petición HTTP al servicio de departamentos antes de crear el empleado.
 *       
 *       **Resiliencia:**
 *       - Timeout: 3 segundos
 *       - Reintentos: 2
 *       - Si el servicio de departamentos no responde, retorna 503
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Empleado'
 *     responses:
 *       201:
 *         description: Empleado creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Empleado'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailable'
 */
router.post('/', (req, res) => empleadoController.crear(req, res));

/**
 * @swagger
 * /empleados/{id}:
 *   get:
 *     tags:
 *       - Empleados
 *     summary: Obtener un empleado por ID
 *     description: Busca y retorna un empleado específico por su identificador único
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del empleado
 *         example: EMP001
 *     responses:
 *       201:
 *         description: Empleado encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Empleado'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', (req, res) => empleadoController.obtenerPorId(req, res));

/**
 * @swagger
 * /empleados:
 *   get:
 *     tags:
 *       - Empleados
 *     summary: Listar empleados con paginación
 *     description: |
 *       Obtiene una lista paginada de empleados con soporte para filtrado y ordenamiento.
 *       
 *       **Características:**
 *       - Paginación configurable
 *       - Filtrado por nombre, departamento
 *       - Búsqueda general con parámetro 'q'
 *       - Ordenamiento por cualquier campo
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
 *           enum: [id, nombre, email, departamento_id, fecha_ingreso]
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
 *         description: Búsqueda general (nombre, email)
 *       - in: query
 *         name: nombre
 *         schema:
 *           type: string
 *         description: Filtrar por nombre (búsqueda parcial)
 *       - in: query
 *         name: departamentoId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de departamento
 *     responses:
 *       201:
 *         description: Lista de empleados paginada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmpleadoPaginado'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', (req, res) => empleadoController.obtenerTodos(req, res));

/**
 * @swagger
 * /empleados/{id}:
 *   put:
 *     tags:
 *       - Empleados
 *     summary: Actualizar un empleado
 *     description: Actualiza los datos de un empleado existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del empleado
 *         example: EMP001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Empleado'
 *     responses:
 *       200:
 *         description: Empleado actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Empleado'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', (req, res) => empleadoController.actualizar(req, res));

/**
 * @swagger
 * /empleados/{id}:
 *   delete:
 *     tags:
 *       - Empleados
 *     summary: Eliminar un empleado (desvinculación)
 *     description: |
 *       Elimina un empleado del sistema y publica un evento `empleado.eliminado` 
 *       en RabbitMQ para notificar a otros servicios.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del empleado
 *         example: EMP001
 *     responses:
 *       200:
 *         description: Empleado eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Empleado EMP001 eliminado exitosamente
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', (req, res) => empleadoController.eliminar(req, res));

module.exports = router;
