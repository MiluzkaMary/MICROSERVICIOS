/**
 * Rutas para operaciones de Notificaciones
 */
const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     tags:
 *       - Notificaciones
 *     summary: Lista todas las notificaciones registradas
 *     description: Obtiene el historial completo de notificaciones enviadas
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Notificacion'
 *                 total:
 *                   type: integer
 *                   example: 25
 */
router.get('/', notificacionController.listarNotificaciones);

/**
 * @swagger
 * /notificaciones/estadisticas/resumen:
 *   get:
 *     tags:
 *       - Notificaciones
 *     summary: Obtiene estadísticas de notificaciones
 *     description: Retorna estadísticas generales del sistema de notificaciones
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                       example: "100"
 *                     bienvenidas:
 *                       type: string
 *                       example: "75"
 *                     desvinculaciones:
 *                       type: string
 *                       example: "25"
 *                     enviadas:
 *                       type: string
 *                       example: "95"
 *                     fallidas:
 *                       type: string
 *                       example: "3"
 *                     pendientes:
 *                       type: string
 *                       example: "2"
 */
router.get('/estadisticas/resumen', notificacionController.obtenerEstadisticas);

/**
 * @swagger
 * /notificaciones/{empleadoId}:
 *   get:
 *     tags:
 *       - Notificaciones
 *     summary: Lista notificaciones de un empleado específico
 *     description: Obtiene el historial de notificaciones enviadas a un empleado
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
 *         description: Notificaciones obtenidas exitosamente
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
 *                     $ref: '#/components/schemas/Notificacion'
 *                 total:
 *                   type: integer
 *                   example: 2
 *       400:
 *         description: empleadoId inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:empleadoId', notificacionController.listarPorEmpleado);

/**
 * @swagger
 * /notificaciones/evento/empleado-creado:
 *   post:
 *     tags:
 *       - Eventos
 *     summary: Endpoint interno para evento empleado.creado
 *     description: Procesa el evento de empleado creado y envía notificación de bienvenida. En el futuro será reemplazado por RabbitMQ.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventoEmpleadoCreado'
 *     responses:
 *       201:
 *         description: Notificación procesada y enviada exitosamente
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
 *                   example: "Notificación de bienvenida procesada"
 *                 data:
 *                   $ref: '#/components/schemas/Notificacion'
 *       400:
 *         description: Datos del evento inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/evento/empleado-creado', notificacionController.manejarEmpleadoCreado);

/**
 * @swagger
 * /notificaciones/evento/empleado-desvinculado:
 *   post:
 *     tags:
 *       - Eventos
 *     summary: Endpoint interno para evento empleado.desvinculado
 *     description: Procesa el evento de empleado desvinculado y envía notificación. En el futuro será reemplazado por RabbitMQ.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventoEmpleadoDesvinculado'
 *     responses:
 *       201:
 *         description: Notificación procesada y enviada exitosamente
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
 *                   example: "Notificación de desvinculación procesada"
 *                 data:
 *                   $ref: '#/components/schemas/Notificacion'
 *       400:
 *         description: Datos del evento inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/evento/empleado-desvinculado', notificacionController.manejarEmpleadoDesvinculado);

module.exports = router;
