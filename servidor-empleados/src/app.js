const express = require("express");
const empleadoRoutes = require('./routes/empleadoRoutes');

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use('/empleados', empleadoRoutes);

// Ruta de health check
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
