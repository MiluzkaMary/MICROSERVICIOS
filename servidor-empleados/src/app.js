const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const empleadoRoutes = require('./routes/empleadoRoutes');
const { getCircuitBreakerStats } = require('./utils/circuitBreakerClient');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Empleados - Documentación'
}));

// Endpoint para obtener la especificación OpenAPI en JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas
app.use('/empleados', empleadoRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check del servicio
 *     description: Verifica que el servicio esté activo y funcionando correctamente
 *     responses:
 *       200:
 *         description: Servicio funcionando correctamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Health'
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'servidor-empleados' });
});

/**
 * @swagger
 * /circuit-breaker/status:
 *   get:
 *     tags:
 *       - Monitoring
 *     summary: Estado del Circuit Breaker
 *     description: Obtiene estadísticas y estado actual del Circuit Breaker para el servicio de departamentos
 *     responses:
 *       200:
 *         description: Estadísticas del Circuit Breaker
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: departamentos-service-breaker
 *                 state:
 *                   type: string
 *                   enum: [CLOSED, OPEN, HALF_OPEN]
 *                   description: CLOSED = funcionando normal, OPEN = circuito abierto (muchos fallos), HALF_OPEN = probando recuperación
 *                   example: CLOSED
 *                 stats:
 *                   type: object
 *                   properties:
 *                     successes:
 *                       type: number
 *                       description: Número de llamadas exitosas
 *                     failures:
 *                       type: number
 *                       description: Número de llamadas fallidas
 *                     fallbacks:
 *                       type: number
 *                       description: Número de veces que se ejecutó el fallback
 *                     timeouts:
 *                       type: number
 *                       description: Número de timeouts
 *                     rejects:
 *                       type: number
 *                       description: Número de llamadas rechazadas (circuito abierto)
 *                     fires:
 *                       type: number
 *                       description: Total de intentos de llamada
 *                     latencyMean:
 *                       type: number
 *                       description: Latencia promedio en milisegundos
 */
app.get('/circuit-breaker/status', (req, res) => {
  const stats = getCircuitBreakerStats();
  res.status(200).json(stats);
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'Recurso no encontrado',
    status: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  
  const statusCode = err.statusCode || 500;
  const errorNames = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    500: 'Internal Server Error'
  };

  res.status(statusCode).json({
    error: errorNames[statusCode] || 'Internal Server Error',
    message: err.message || 'Error interno del servidor',
    status: statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
