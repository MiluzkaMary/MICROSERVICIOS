jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

jest.mock('../../src/services/empleadoService', () => ({
  crearEmpleado: jest.fn(),
  obtenerEmpleadoPorId: jest.fn(),
  obtenerEmpleadosConPaginacion: jest.fn(),
  actualizarEmpleado: jest.fn(),
  eliminarEmpleado: jest.fn(),
  reactivarEmpleado: jest.fn()
}));

jest.mock('../../src/utils/circuitBreakerClient', () => ({
  getCircuitBreakerStats: jest.fn(() => ({
    name: 'departamentos-service-breaker',
    state: 'CLOSED',
    isOpen: false,
    isClosed: true,
    isHalfOpen: false,
    stats: {
      successes: 1,
      failures: 0,
      fallbacks: 0,
      timeouts: 0,
      rejects: 0,
      fires: 1,
      latencyMean: 0,
      percentiles: {}
    },
    config: {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
      volumeThreshold: 3
    }
  }))
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const empleadoService = require('../../src/services/empleadoService');
const app = require('../../src/app');

function configurarJwt() {
  jwt.verify.mockImplementation((token) => {
    if (token === 'user-token') {
      return { sub: 'emp-1', role: 'USER' };
    }

    if (token === 'admin-token') {
      return { sub: 'emp-2', role: 'ADMIN' };
    }

    const error = new Error('jwt malformed');
    error.name = 'JsonWebTokenError';
    throw error;
  });
}

describe('app y rutas de empleados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configurarJwt();
    empleadoService.crearEmpleado.mockResolvedValue({
      success: true,
      statusCode: 201,
      data: { id: 1, nombre: 'Ana Gómez' }
    });
    empleadoService.obtenerEmpleadoPorId.mockResolvedValue({
      success: true,
      statusCode: 201,
      data: { id: 1, nombre: 'Ana Gómez' }
    });
    empleadoService.obtenerEmpleadosConPaginacion.mockResolvedValue({
      success: true,
      statusCode: 201,
      data: {
        page: 1,
        size: 10,
        totalRecords: 1,
        totalPages: 1,
        items: [{ id: 1, nombre: 'Ana Gómez' }]
      }
    });
    empleadoService.actualizarEmpleado.mockResolvedValue({
      success: true,
      statusCode: 200,
      data: { id: 1, nombre: 'Ana Gómez Actualizada' }
    });
    empleadoService.eliminarEmpleado.mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Empleado 1 desactivado exitosamente'
    });
    empleadoService.reactivarEmpleado.mockResolvedValue({
      success: true,
      statusCode: 200,
      message: 'Empleado 1 reactivado exitosamente',
      data: { id: 1, activo: true }
    });
  });

  test('GET /health responde OK', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'OK', service: 'servidor-empleados' });
  });

  test('GET /empleados sin header Authorization responde 401', async () => {
    const response = await request(app).get('/empleados');

    expect(response.status).toBe(401);
    expect(response.body).toEqual(expect.objectContaining({
      success: false,
      statusCode: 401,
      code: 'TOKEN_MISSING'
    }));
  });

  test('GET /empleados con token USER retorna listado paginado', async () => {
    const response = await request(app)
      .get('/empleados?page=1&size=10')
      .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      page: 1,
      size: 10,
      totalRecords: 1,
      totalPages: 1,
      items: [{ id: 1, nombre: 'Ana Gómez' }]
    });
    expect(empleadoService.obtenerEmpleadosConPaginacion).toHaveBeenCalledWith(
      expect.objectContaining({ page: '1', size: '10' })
    );
  });

  test('GET /empleados/:id con token USER retorna empleado', async () => {
    const response = await request(app)
      .get('/empleados/1')
      .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1, nombre: 'Ana Gómez' });
    expect(empleadoService.obtenerEmpleadoPorId).toHaveBeenCalledWith('1');
  });

  test('GET /empleados/:id inexistente retorna 404', async () => {
    empleadoService.obtenerEmpleadoPorId.mockResolvedValueOnce({
      success: false,
      statusCode: 404,
      message: 'El empleado con id 99 no existe'
    });

    const response = await request(app)
      .get('/empleados/99')
      .set('Authorization', 'Bearer user-token');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(expect.objectContaining({
      error: 'Not Found',
      message: 'El empleado con id 99 no existe'
    }));
  });

  test('POST /empleados con token ADMIN crea el empleado', async () => {
    const response = await request(app)
      .post('/empleados')
      .set('Authorization', 'Bearer admin-token')
      .send({
        nombre: 'Ana Gómez',
        email: 'ana.gomez@empresa.com',
        departamentoId: '10',
        fechaIngreso: '2024-02-01'
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 1, nombre: 'Ana Gómez' });
    expect(empleadoService.crearEmpleado).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana Gómez' }),
      'admin-token'
    );
  });

  test('POST /empleados con token USER responde 403', async () => {
    const response = await request(app)
      .post('/empleados')
      .set('Authorization', 'Bearer user-token')
      .send({
        nombre: 'Ana Gómez',
        email: 'ana.gomez@empresa.com',
        departamentoId: '10',
        fechaIngreso: '2024-02-01'
      });

    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({
      code: 'INSUFFICIENT_PERMISSIONS'
    }));
    expect(empleadoService.crearEmpleado).not.toHaveBeenCalled();
  });

  test('PUT /empleados/:id actualiza el empleado', async () => {
    const response = await request(app)
      .put('/empleados/1')
      .set('Authorization', 'Bearer admin-token')
      .send({
        nombre: 'Ana Gómez Actualizada',
        email: 'ana.gomez@empresa.com',
        departamentoId: '11',
        fechaIngreso: '2024-03-01'
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ id: 1, nombre: 'Ana Gómez Actualizada' });
    expect(empleadoService.actualizarEmpleado).toHaveBeenCalledWith('1', expect.objectContaining({ nombre: 'Ana Gómez Actualizada' }));
  });

  test('DELETE /empleados/:id desactiva el empleado', async () => {
    const response = await request(app)
      .delete('/empleados/1')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Empleado 1 desactivado exitosamente' });
    expect(empleadoService.eliminarEmpleado).toHaveBeenCalledWith('1');
  });

  test('PATCH /empleados/:id/reactivar reactiva el empleado', async () => {
    const response = await request(app)
      .patch('/empleados/1/reactivar')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Empleado 1 reactivado exitosamente',
      data: { id: 1, activo: true }
    });
    expect(empleadoService.reactivarEmpleado).toHaveBeenCalledWith('1');
  });

  test('GET /circuit-breaker/status usa las estadísticas del breaker', async () => {
    const response = await request(app).get('/circuit-breaker/status');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      name: 'departamentos-service-breaker',
      state: 'CLOSED'
    }));
  });

  test('ruta inexistente responde 404', async () => {
    const response = await request(app).get('/no-existe');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(expect.objectContaining({
      statusCode: 404,
      code: 'NOT_FOUND'
    }));
  });
});
