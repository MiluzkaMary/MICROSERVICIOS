/**
 * Servidor Gateway - Express Gateway
 * Punto de entrada que carga la configuración de Express Gateway
 */
const path = require('path');
const express = require('express');
const gateway = require('express-gateway');
const client = require('prom-client');
const { initTelemetry } = require('./telemetry');

initTelemetry('gateway-service');

const managementApp = express();
const managementPort = Number(process.env.OBSERVABILITY_PORT || 9095);

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'gateway_' });

managementApp.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', service: 'gateway-service' });
});

managementApp.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

managementApp.listen(managementPort, () => {
  console.log(`Gateway observability en http://0.0.0.0:${managementPort}`);
});

gateway()
  .load(path.join(__dirname, 'config'))
  .run();
