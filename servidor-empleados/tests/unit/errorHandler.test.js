const {
  ERROR_CODES,
  createErrorResponse,
  globalErrorHandler,
  notFoundHandler
} = require('../../src/utils/errorHandler');

function crearRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

describe('errorHandler', () => {
  test('createErrorResponse construye una respuesta estándar', () => {
    const response = createErrorResponse(
      400,
      'Datos inválidos',
      ERROR_CODES.BAD_REQUEST,
      '/empleados',
      'POST',
      ['nombre es requerido']
    );

    expect(response).toMatchObject({
      success: false,
      statusCode: 400,
      error: 'Bad Request',
      message: 'Datos inválidos',
      code: ERROR_CODES.BAD_REQUEST,
      path: '/empleados',
      method: 'POST',
      errors: ['nombre es requerido']
    });
    expect(response.timestamp).toBeDefined();
  });

  test('notFoundHandler responde 404 con ruta no encontrada', () => {
    const req = { originalUrl: '/ruta-inexistente', method: 'GET' };
    const res = crearRes();
    const next = jest.fn();

    notFoundHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      code: ERROR_CODES.NOT_FOUND,
      message: 'La ruta GET /ruta-inexistente no existe'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('globalErrorHandler usa status y code del error', () => {
    const req = { originalUrl: '/empleados', method: 'POST' };
    const res = crearRes();
    const next = jest.fn();
    const error = new Error('fallo interno');
    error.statusCode = 503;
    error.code = ERROR_CODES.SERVICE_UNAVAILABLE;
    error.errors = ['servicio caído'];

    globalErrorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 503,
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      message: 'fallo interno',
      errors: ['servicio caído']
    }));
    expect(next).not.toHaveBeenCalled();
  });
});
