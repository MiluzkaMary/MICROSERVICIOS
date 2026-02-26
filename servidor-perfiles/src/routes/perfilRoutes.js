/**
 * Rutas para operaciones de Perfiles
 */
const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

/**
 * @swagger
 * /perfiles:
 *   get:
 *     tags:
 *       - Perfiles
 *     summary: Lista todos los perfiles
 *     description: Obtiene la lista completa de perfiles de empleados registrados
 *     responses:
 *       200:
 *         description: Lista de perfiles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Perfil'
 *                 total:
 *                   type: integer
 *                   example: 10
 */
router.get('/', perfilController.listarPerfiles);

/**
 * @swagger
 * /perfiles/{empleadoId}:
 *   get:
 *     tags:
 *       - Perfiles
 *     summary: Consulta el perfil de un empleado
 *     description: Obtiene el perfil completo de un empleado específico
 *     parameters:
 *       - in: path
 *         name: empleadoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del empleado
 *         example: E001
 *     responses:
 *       200:
 *         description: Perfil encontrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/Perfil'
 *       404:
 *         description: Perfil no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:empleadoId', perfilController.obtenerPerfil);

/**
 * @swagger
 * /perfiles/{empleadoId}:
 *   put:
 *     tags:
 *       - Perfiles
 *     summary: Actualiza el perfil de un empleado
 *     description: Actualiza la información del perfil (teléfono, dirección, biografía, etc.)
 *     parameters:
 *       - in: path
 *         name: empleadoId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del empleado
 *         example: E001
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PerfilInput'
 *           examples:
 *             completo:
 *               summary: Actualización completa
 *               value:
 *                 telefono: "+57 300 123 4567"
 *                 direccion: "Calle 123 #45-67"
 *                 ciudad: "Bogotá"
 *                 biografia: "Desarrollador Full Stack con 5 años de experiencia en Node.js y React"
 *             parcial:
 *               summary: Actualización parcial
 *               value:
 *                 telefono: "+57 300 123 4567"
 *                 ciudad: "Medellín"
 *             solo_biografia:
 *               summary: Solo biografía
 *               value:
 *                 biografia: "Ingeniero de Software especializado en arquitecturas de microservicios"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Perfil actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Perfil'
 *       404:
 *         description: Perfil no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:empleadoId', perfilController.actualizarPerfil);

/**
 * @swagger
 * /perfiles/evento/empleado-creado:
 *   post:
 *     tags:
 *       - Perfiles
 *     summary: Endpoint interno para evento empleado.creado
 *     description: Crea un perfil por defecto cuando se registra un nuevo empleado. En el futuro será reemplazado por RabbitMQ.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empleadoId
 *               - nombre
 *               - email
 *             properties:
 *               empleadoId:
 *                 type: string
 *                 example: "E001"
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan.perez@empresa.com"
 *     responses:
 *       201:
 *         description: Perfil creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Perfil creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Perfil'
 */
router.post('/evento/empleado-creado', perfilController.manejarEmpleadoCreado);

module.exports = router;
