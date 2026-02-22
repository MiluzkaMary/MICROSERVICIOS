const express = require('express');
const departamentoRoutes = require('./routes/departamentoRoutes');

const app = express();
app.use(express.json());

app.use('/departamentos', departamentoRoutes);

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({ mensaje: 'Recurso no encontrado' });
});

module.exports = app;
