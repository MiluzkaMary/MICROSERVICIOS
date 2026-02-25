/**
 * Utilidades para el servicio de notificaciones
 * Este archivo está preparado para futuras utilidades
 */

/**
 * Formatea una fecha para mensajes de notificación
 */
function formatearFecha(fecha) {
  const opciones = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(fecha).toLocaleDateString('es-ES', opciones);
}

/**
 * Sanitiza texto para evitar inyección en emails
 */
function sanitizarTexto(texto) {
  if (!texto) return '';
  return texto
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 1000);
}

module.exports = {
  formatearFecha,
  sanitizarTexto
};
