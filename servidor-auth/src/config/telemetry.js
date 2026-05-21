const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { ZipkinExporter } = require('@opentelemetry/exporter-zipkin');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

let sdk;

function initTelemetry(defaultServiceName) {
  if (sdk) {
    return;
  }

  const serviceName = process.env.OTEL_SERVICE_NAME || defaultServiceName;
  const endpoint = process.env.OTEL_EXPORTER_ZIPKIN_ENDPOINT || 'http://zipkin:9411/api/v2/spans';

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    traceExporter: new ZipkinExporter({ url: endpoint }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();
  } catch (err) {
    console.error('OTel init error:', err.message);
  }

  const shutdown = async () => {
    if (!sdk) {
      return;
    }
    try {
      await sdk.shutdown();
    } catch (err) {
      console.error('OTel shutdown error:', err.message);
    }
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { initTelemetry };
