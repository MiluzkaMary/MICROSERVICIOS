const express = require("express");
const client = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const { notFoundHandler, globalErrorHandler } = require('./utils/errorHandler');

const app = express();

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'auth_' });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total de peticiones HTTP',
  labelNames: ['service', 'method', 'route', 'status'],
  registers: [register],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duracion de peticiones HTTP en segundos',
  labelNames: ['service', 'method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware para parsear JSON
app.use(express.json());

app.use((req, res, next) => {
  const endTimer = httpRequestDurationSeconds.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';
    const labels = {
      service: 'auth-service',
      method: req.method,
      route,
      status: String(res.statusCode),
    };
    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });
  next();
});

app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Auth - Documentación'
}));

// Endpoint para obtener la especificación OpenAPI en JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Rutas
app.use('/auth', authRoutes);

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
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 service:
 *                   type: string
 *                   example: servidor-auth
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'servidor-auth' });
});

// Middleware para rutas no encontradas (404) - debe ir después de todas las rutas
app.use(notFoundHandler);

// Middleware global de manejo de errores - debe ser el último
app.use(globalErrorHandler);

module.exports = app;
