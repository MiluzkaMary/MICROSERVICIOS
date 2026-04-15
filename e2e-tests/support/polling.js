async function esperarHastaQue(condicion, { maxIntentos = 12, intervaloMs = 2000 } = {}) {
  // 12 intentos x 2 segundos = ~24s, suficiente para la propagacion asincrona de eventos RabbitMQ en Docker.
  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    try {
      const resultado = await condicion();
      if (resultado) {
        return resultado;
      }
    } catch (error) {
      if (intento === maxIntentos) {
        throw new Error(`La condicion no se cumplio despues de ${maxIntentos} intentos. Ultimo error: ${error.message}`);
      }
    }

    if (intento < maxIntentos) {
      await new Promise((resolve) => setTimeout(resolve, intervaloMs));
    }
  }

  throw new Error(`La condicion no se cumplio despues de ${maxIntentos} intentos y ${intervaloMs}ms entre intentos.`);
}

module.exports = {
  esperarHastaQue
};