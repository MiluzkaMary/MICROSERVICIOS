/**
 * Punto de entrada de la aplicacion
 * Inicia el servidor
 */
const app = require('./src/app');
const rabbitmq = require('./src/config/rabbitmq');

const PORT = process.env.PORT || 8080;

// Inicializar RabbitMQ y luego iniciar el servidor
async function iniciarServidor() {
  try {
    // Conectar a RabbitMQ
    await rabbitmq.connect();
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error.message);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Cerrando servidor...');
  await rabbitmq.close();
  process.exit(0);
});

iniciarServidor();
