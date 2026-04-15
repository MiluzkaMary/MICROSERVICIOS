const { Before, After, AfterStep, setDefaultTimeout } = require('@cucumber/cucumber');

setDefaultTimeout(30000);

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