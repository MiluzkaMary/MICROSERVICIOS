const { Before, BeforeAll, After, AfterAll, AfterStep, setDefaultTimeout } = require('@cucumber/cucumber');
const axios = require('axios');
const { cleanupE2eTestData } = require('./dbCleanup');
const { esperarHastaQue } = require('./polling');

function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// El timeout por paso debe cubrir el peor caso del polling para evitar falsos negativos en CI.
const pollingAttempts = toPositiveInt(process.env.POLLING_MAX_ATTEMPTS, 12);
const pollingIntervalMs = toPositiveInt(process.env.POLLING_INTERVAL_MS, 2000);
const pollingBudgetMs = pollingAttempts * pollingIntervalMs;
const configuredStepTimeoutMs = toPositiveInt(process.env.CUCUMBER_STEP_TIMEOUT_MS, 0);
const stepTimeoutMs = configuredStepTimeoutMs > 0
  ? configuredStepTimeoutMs
  : Math.max(30000, pollingBudgetMs + 10000);

setDefaultTimeout(stepTimeoutMs);

function crearMapaPasos(gherkinDocument) {
  const mapa = new Map();
  if (!gherkinDocument || !gherkinDocument.feature) return mapa;

  for (const child of gherkinDocument.feature.children || []) {
    const scenario = child.scenario;
    if (!scenario) continue;

    for (const step of scenario.steps || []) {
      mapa.set(step.id, `${step.keyword}${step.text}`);
    }
  }

  return mapa;
}

Before(function () {
  this.response = null;
  this.token = null;
  this.lastCreatedEmpleado = null;
  this.lastCreatedDepartamento = null;
  this.lastRecoveryToken = null;
  this._stepTextByAstId = new Map();
});

BeforeAll(async function () {
  const baseUrl = process.env.BASE_URL || 'http://localhost:8085';
  const http = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true
  });

  await esperarHastaQue(async () => {
    const respuesta = await http.post('/auth/login', {
      email: process.env.ADMIN_EMAIL || '',
      password: process.env.ADMIN_PASSWORD || ''
    });

    if (respuesta.status === 200 && respuesta.data && respuesta.data.token) {
      return true;
    }

    if ([502, 503, 504].includes(respuesta.status)) {
      throw new Error(`Gateway no listo (${respuesta.status})`);
    }

    throw new Error(`Auth no disponible todavía (${respuesta.status})`);
  }, {
    maxIntentos: process.env.AUTH_LOGIN_MAX_ATTEMPTS,
    intervaloMs: process.env.AUTH_LOGIN_INTERVAL_MS
  });
});

Before(function ({ pickle, gherkinDocument }) {
  this._stepTextByAstId = crearMapaPasos(gherkinDocument);

  const featureName = gherkinDocument && gherkinDocument.feature
    ? gherkinDocument.feature.name
    : 'Feature';

  console.log(`\nCaracterística: ${featureName}`);
  console.log(`\n  Escenario: ${pickle.name}`);
});

Before({ tags: '@necesita-admin' }, async function () {
  await this.autenticarComo('ADMIN');
});

Before({ tags: '@necesita-user' }, async function () {
  await this.autenticarComo('USER');
});

AfterStep(function ({ pickleStep, result }) {
  const astNodeId = pickleStep.astNodeIds && pickleStep.astNodeIds.length > 0
    ? pickleStep.astNodeIds[0]
    : null;

  const textoPaso = astNodeId && this._stepTextByAstId.has(astNodeId)
    ? this._stepTextByAstId.get(astNodeId)
    : `Paso: ${pickleStep.text}`;

  console.log(`    ${textoPaso}`);

  if (result && result.status === 'PASSED') {
    console.log('    ✔ Paso exitoso');
  } else if (result && result.status === 'FAILED') {
    console.log('    ✖ Paso fallido');
  } else {
    console.log('    • Paso sin ejecutar');
  }
});

After(async function (scenario) {
  if (scenario.result && scenario.result.status === 'FAILED') {
    const status = this.response ? this.response.status : 'sin respuesta';
    const body = this.response ? JSON.stringify(this.response.data, null, 2) : 'sin cuerpo';

    // El logging de fallo deja el ultimo estado observable sin depender de un debugger.
    console.error(`Escenario fallido: ${scenario.pickle ? scenario.pickle.name : 'desconocido'}`);
    console.error(`Ultima respuesta HTTP: ${status}`);
    console.error(body);
  }
});

AfterAll(async function () {
  if (String(process.env.E2E_DB_CLEANUP || 'true').toLowerCase() === 'false') {
    console.log('Limpieza de DB omitida por E2E_DB_CLEANUP=false');
    return;
  }

  try {
    await cleanupE2eTestData((msg) => console.log(`[cleanup] ${msg}`));
    console.log('[cleanup] Limpieza de datos de prueba finalizada');
  } catch (error) {
    console.error('[cleanup] Fallo durante la limpieza de datos E2E:', error.message);
    throw error;
  }
});