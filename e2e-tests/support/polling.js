function toPositiveInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function esperarHastaQue(condicion, { maxIntentos, intervaloMs } = {}) {
  const defaultMaxIntentos = toPositiveInt(process.env.POLLING_MAX_ATTEMPTS, 12);
  const defaultIntervaloMs = toPositiveInt(process.env.POLLING_INTERVAL_MS, 2000);
  const intentos = toPositiveInt(maxIntentos, defaultMaxIntentos);
  const intervalo = toPositiveInt(intervaloMs, defaultIntervaloMs);

  for (let intento = 1; intento <= intentos; intento += 1) {
    try {
      const resultado = await condicion();
      if (resultado) {
        return resultado;
      }
    } catch (error) {
      if (intento === intentos) {
        throw new Error(`La condicion no se cumplio despues de ${intentos} intentos. Ultimo error: ${error.message}`);
      }
    }

    if (intento < intentos) {
      await new Promise((resolve) => setTimeout(resolve, intervalo));
    }
  }

  throw new Error(`La condicion no se cumplio despues de ${intentos} intentos y ${intervalo}ms entre intentos.`);
}

module.exports = {
  esperarHastaQue
};