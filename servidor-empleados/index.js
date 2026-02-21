/**
 * Punto de entrada de la aplicacion
 * Inicia el servidor
 */
const app = require('./src/app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});


