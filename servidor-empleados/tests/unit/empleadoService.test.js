jest.mock('../../src/repositories/empleadoRepository', () => ({
  buscarPorEmail: jest.fn(),
  buscarPorId: jest.fn(),
  obtenerTodos: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  eliminar: jest.fn(),
  reactivar: jest.fn(),
  obtenerConPaginacion: jest.fn()
}));

jest.mock('../../src/config/rabbitmq', () => ({
  publicarEvento: jest.fn()
}));

jest.mock('../../src/utils/circuitBreakerClient', () => ({
  httpGetWithCircuitBreaker: jest.fn()
}));

const empleadoRepository = require('../../src/repositories/empleadoRepository');
const { publicarEvento } = require('../../src/config/rabbitmq');
const { httpGetWithCircuitBreaker } = require('../../src/utils/circuitBreakerClient');
const empleadoService = require('../../src/services/empleadoService');

function crearEmpleadoMock(overrides = {}) {
  const base = {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    departamentoId: '10',
    fechaIngreso: '2024-01-15',
    activo: true
  };

  const data = { ...base, ...overrides };
  return {
    ...data,
    toJSON: () => ({ ...data })
  };
}

describe('EmpleadoService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    empleadoRepository.buscarPorEmail.mockResolvedValue(null);
    empleadoRepository.buscarPorId.mockResolvedValue(null);
    empleadoRepository.obtenerTodos.mockResolvedValue([]);
    empleadoRepository.crear.mockResolvedValue(crearEmpleadoMock());
    empleadoRepository.actualizar.mockResolvedValue(crearEmpleadoMock());
    empleadoRepository.eliminar.mockResolvedValue(crearEmpleadoMock({ activo: false }));
    empleadoRepository.reactivar.mockResolvedValue(crearEmpleadoMock({ activo: true }));
    empleadoRepository.obtenerConPaginacion.mockResolvedValue({
      items: [],
      page: 1,
      size: 10,
      totalRecords: 0,
      totalPages: 1
    });
    httpGetWithCircuitBreaker.mockResolvedValue({ statusCode: 200, ok: true, data: { id: '10' } });
    publicarEvento.mockResolvedValue(true);
  });

  test('crear empleado con datos válidos retorna el empleado creado', async () => {
    const empleadoCreado = crearEmpleadoMock({ id: 7, nombre: 'Ana Gómez', email: 'ana.gomez@empresa.com' });
    empleadoRepository.crear.mockResolvedValueOnce(empleadoCreado);

    const resultado = await empleadoService.crearEmpleado({
      nombre: 'Ana Gómez',
      email: 'Ana.Gomez@Empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    }, 'token-admin');

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(201);
    expect(resultado.data).toEqual(empleadoCreado.toJSON());
    expect(httpGetWithCircuitBreaker).toHaveBeenCalledWith(
      expect.stringContaining('/departamentos/10'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer token-admin' }
      })
    );
    expect(empleadoRepository.buscarPorEmail).toHaveBeenCalledWith('ana.gomez@empresa.com');
    expect(empleadoRepository.crear).toHaveBeenCalledTimes(1);
    expect(publicarEvento).toHaveBeenCalledWith(
      'empleado.creado',
      expect.objectContaining({
        empleadoId: 7,
        nombre: 'Ana Gómez',
        email: 'ana.gomez@empresa.com',
        departamentoId: '10'
      })
    );
  });

  test('crear empleado con departamento inexistente retorna error', async () => {
    httpGetWithCircuitBreaker.mockResolvedValueOnce({ statusCode: 404, ok: false, data: null });

    const resultado = await empleadoService.crearEmpleado({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '99',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(400);
    expect(resultado.message).toContain('no existe');
    expect(empleadoRepository.buscarPorEmail).not.toHaveBeenCalled();
    expect(empleadoRepository.crear).not.toHaveBeenCalled();
  });

  test('crear empleado cuando el servicio de departamentos falla retorna 503', async () => {
    httpGetWithCircuitBreaker.mockRejectedValueOnce(new Error('timeout'));

    const resultado = await empleadoService.crearEmpleado({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(503);
    expect(resultado.message).toContain('no disponible');
  });

  test('crear empleado cuando el servicio de departamentos responde con error inesperado retorna 502', async () => {
    httpGetWithCircuitBreaker.mockResolvedValueOnce({ statusCode: 500, ok: false, data: null });

    const resultado = await empleadoService.crearEmpleado({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(502);
    expect(resultado.message).toContain('Error validando departamento');
    expect(empleadoRepository.buscarPorEmail).not.toHaveBeenCalled();
    expect(empleadoRepository.crear).not.toHaveBeenCalled();
  });

  test('crear empleado cuando RabbitMQ falla retorna 500', async () => {
    publicarEvento.mockRejectedValueOnce(new Error('rabbit down'));

    const resultado = await empleadoService.crearEmpleado({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(500);
    expect(resultado.message).toContain('Error interno al crear el empleado');
    expect(empleadoRepository.crear).toHaveBeenCalledTimes(1);
  });

  test('crear empleado con email duplicado retorna conflicto', async () => {
    empleadoRepository.buscarPorEmail.mockResolvedValueOnce(crearEmpleadoMock({ id: 22, activo: true }));

    const resultado = await empleadoService.crearEmpleado({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(409);
    expect(resultado.message).toContain('Ya existe un empleado con email');
    expect(empleadoRepository.crear).not.toHaveBeenCalled();
  });

  test('obtener empleado por id existente retorna el empleado', async () => {
    const empleado = crearEmpleadoMock({ id: 8, nombre: 'Luis Rojas' });
    empleadoRepository.buscarPorId.mockResolvedValueOnce(empleado);

    const resultado = await empleadoService.obtenerEmpleadoPorId('8');

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(201);
    expect(resultado.data).toEqual(empleado.toJSON());
  });

  test('obtener empleado por id inexistente retorna 404', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(null);

    const resultado = await empleadoService.obtenerEmpleadoPorId('999');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(404);
    expect(resultado.message).toContain('no existe');
  });

  test('listar empleados retorna un array', async () => {
    const empleados = [
      crearEmpleadoMock({ id: 1, nombre: 'Ana Gómez' }),
      crearEmpleadoMock({ id: 2, nombre: 'Luis Rojas' })
    ];
    empleadoRepository.obtenerTodos.mockResolvedValueOnce(empleados);

    const resultado = await empleadoService.obtenerTodosEmpleados();

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(201);
    expect(Array.isArray(resultado.data)).toBe(true);
    expect(resultado.data).toHaveLength(2);
    expect(resultado.data).toEqual(empleados.map((empleado) => empleado.toJSON()));
  });

  test('listar empleados con paginación retorna metadata y elementos', async () => {
    const empleados = [
      crearEmpleadoMock({ id: 3, nombre: 'Clara Torres' }),
      crearEmpleadoMock({ id: 4, nombre: 'Diego Pérez' })
    ];
    empleadoRepository.obtenerConPaginacion.mockResolvedValueOnce({
      items: empleados,
      page: 2,
      size: 5,
      totalRecords: 12,
      totalPages: 3
    });

    const resultado = await empleadoService.obtenerEmpleadosConPaginacion({
      page: '2',
      size: '5',
      sortBy: 'nombre',
      order: 'DESC',
      q: 'clara',
      estado: 'activo'
    });

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(201);
    expect(resultado.data).toEqual({
      page: 2,
      size: 5,
      totalRecords: 12,
      totalPages: 3,
      items: empleados.map((empleado) => empleado.toJSON())
    });
    expect(empleadoRepository.obtenerConPaginacion).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        size: 5,
        sortBy: 'nombre',
        order: 'DESC',
        q: 'clara',
        estado: 'activo'
      })
    );
  });

  test('actualizar empleado existente retorna el empleado actualizado', async () => {
    const empleadoActualizado = crearEmpleadoMock({ id: 5, nombre: 'María López', activo: true });
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 5 }));
    empleadoRepository.actualizar.mockResolvedValueOnce(empleadoActualizado);

    const resultado = await empleadoService.actualizarEmpleado('5', {
      nombre: 'María López',
      email: 'maria.lopez@empresa.com',
      departamentoId: '11',
      fechaIngreso: '2024-03-01'
    });

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(200);
    expect(resultado.data).toEqual(empleadoActualizado.toJSON());
  });

  test('eliminar empleado actualiza activo=false y publica evento', async () => {
    const empleadoEliminado = crearEmpleadoMock({ id: 9, activo: false });
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 9, activo: true }));
    empleadoRepository.eliminar.mockResolvedValueOnce(empleadoEliminado);

    const resultado = await empleadoService.eliminarEmpleado('9');

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(200);
    expect(resultado.message).toContain('desactivado exitosamente');
    expect(empleadoRepository.eliminar).toHaveBeenCalledWith('9');
    expect(publicarEvento).toHaveBeenCalledWith(
      'empleado.eliminado',
      expect.objectContaining({ empleadoId: 9 })
    );
  });

  test('eliminar empleado inexistente retorna 404', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(null);

    const resultado = await empleadoService.eliminarEmpleado('15');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(404);
    expect(resultado.message).toContain('no existe');
    expect(empleadoRepository.eliminar).not.toHaveBeenCalled();
    expect(publicarEvento).not.toHaveBeenCalled();
  });

  test('eliminar empleado cuando el repositorio no elimina retorna 404', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 16, activo: true }));
    empleadoRepository.eliminar.mockResolvedValueOnce(null);

    const resultado = await empleadoService.eliminarEmpleado('16');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(404);
    expect(resultado.message).toContain('no existe');
    expect(publicarEvento).not.toHaveBeenCalled();
  });

  test('eliminar empleado cuando RabbitMQ falla retorna 500', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 10, activo: true }));
    empleadoRepository.eliminar.mockResolvedValueOnce(crearEmpleadoMock({ id: 10, activo: false }));
    publicarEvento.mockRejectedValueOnce(new Error('rabbit down'));

    const resultado = await empleadoService.eliminarEmpleado('10');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(500);
    expect(resultado.message).toContain('Error interno al eliminar el empleado');
  });

  test('reactivar empleado actualiza activo=true y publica evento', async () => {
    const empleadoReactivado = crearEmpleadoMock({ id: 12, activo: true });
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 12, activo: false }));
    empleadoRepository.reactivar.mockResolvedValueOnce(empleadoReactivado);

    const resultado = await empleadoService.reactivarEmpleado('12');

    expect(resultado.success).toBe(true);
    expect(resultado.statusCode).toBe(200);
    expect(resultado.message).toContain('reactivado exitosamente');
    expect(resultado.data).toEqual(empleadoReactivado.toJSON());
    expect(publicarEvento).toHaveBeenCalledWith(
      'empleado.reactivado',
      expect.objectContaining({ empleadoId: 12 })
    );
  });

  test('reactivar empleado inexistente retorna 404', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(null);

    const resultado = await empleadoService.reactivarEmpleado('17');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(404);
    expect(resultado.message).toContain('no existe');
    expect(empleadoRepository.reactivar).not.toHaveBeenCalled();
    expect(publicarEvento).not.toHaveBeenCalled();
  });

  test('reactivar empleado ya activo retorna 409', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 11, activo: true }));

    const resultado = await empleadoService.reactivarEmpleado('11');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(409);
    expect(resultado.message).toContain('ya se encuentra activo');
    expect(empleadoRepository.reactivar).not.toHaveBeenCalled();
    expect(publicarEvento).not.toHaveBeenCalled();
  });

  test('reactivar empleado inexistente retorna 404', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 13, activo: false }));
    empleadoRepository.reactivar.mockResolvedValueOnce(null);

    const resultado = await empleadoService.reactivarEmpleado('13');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(404);
    expect(resultado.message).toContain('no existe');
    expect(publicarEvento).not.toHaveBeenCalled();
  });

  test('reactivar empleado cuando RabbitMQ falla retorna 500', async () => {
    empleadoRepository.buscarPorId.mockResolvedValueOnce(crearEmpleadoMock({ id: 14, activo: false }));
    empleadoRepository.reactivar.mockResolvedValueOnce(crearEmpleadoMock({ id: 14, activo: true }));
    publicarEvento.mockRejectedValueOnce(new Error('rabbit down'));

    const resultado = await empleadoService.reactivarEmpleado('14');

    expect(resultado.success).toBe(false);
    expect(resultado.statusCode).toBe(500);
    expect(resultado.message).toContain('Error interno al reactivar el empleado');
  });
});
