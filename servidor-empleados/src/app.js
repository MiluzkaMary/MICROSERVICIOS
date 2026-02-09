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

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).send("Recurso no encontrado");
});

module.exports = app;
