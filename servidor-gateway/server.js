/**
 * Servidor Gateway - Express Gateway
 * Punto de entrada que carga la configuración de Express Gateway
 */
const path = require('path');
const gateway = require('express-gateway');

gateway()
  .load(path.join(__dirname, 'config'))
  .run();
