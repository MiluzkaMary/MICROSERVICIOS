const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const empleadoRoutes = require('./routes/empleadoRoutes');

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
