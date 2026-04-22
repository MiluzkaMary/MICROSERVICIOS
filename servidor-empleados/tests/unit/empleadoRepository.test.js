jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  getClient: jest.fn()
}));

const db = require('../../src/config/database');
const empleadoRepository = require('../../src/repositories/empleadoRepository');

function crearFila(overrides = {}) {
  return {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    departamento_id: '10',
    fecha_ingreso: '2024-01-15',
    activo: true,
    ...overrides
  };
}

describe('empleadoRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    empleadoRepository._idMode = null;
  });

  test('crear en modo serial inserta sin id manual y mapea el resultado', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ data_type: 'integer', column_default: "nextval('empleados_id_seq'::regclass)" }]
      })
      .mockResolvedValueOnce({ rows: [crearFila({ id: 15, nombre: 'Ana Gómez' })] });

    const resultado = await empleadoRepository.crear({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01',
      activo: true
    });

    expect(resultado.toJSON()).toEqual({
      id: 15,
      nombre: 'Ana Gómez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15',
      activo: true
    });
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][0]).toContain('INSERT INTO empleados (nombre, email, departamento_id, fecha_ingreso, activo)');
  });

  test('crear en modo legacy genera id manual', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ data_type: 'text', column_default: null }]
      })
      .mockResolvedValueOnce({ rows: [crearFila({ id: 'EMP-123', nombre: 'Ana Gómez' })] });

    const resultado = await empleadoRepository.crear({
      nombre: 'Ana Gómez',
      email: 'ana.gomez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01',
      activo: true
    });

    expect(resultado.toJSON().id).toBe('EMP-123');
    expect(db.query.mock.calls[1][1][0]).toMatch(/^EMP-/);
  });

  test('buscarPorId retorna null cuando no existe el empleado', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const resultado = await empleadoRepository.buscarPorId('99');

    expect(resultado).toBeNull();
  });

  test('buscarPorId retorna el empleado mapeado', async () => {
    db.query.mockResolvedValueOnce({ rows: [crearFila({ id: 3, nombre: 'Clara Torres' })] });

    const resultado = await empleadoRepository.buscarPorId('3');

    expect(resultado.toJSON()).toEqual({
      id: 3,
      nombre: 'Clara Torres',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15',
      activo: true
    });
  });

  test('buscarPorEmail retorna null cuando no existe el email', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const resultado = await empleadoRepository.buscarPorEmail('no@existe.com');

    expect(resultado).toBeNull();
  });

  test('buscarPorEmail retorna el empleado mapeado', async () => {
    db.query.mockResolvedValueOnce({ rows: [crearFila({ email: 'maria.lopez@empresa.com' })] });

    const resultado = await empleadoRepository.buscarPorEmail('maria.lopez@empresa.com');

    expect(resultado.toJSON()).toEqual({
      id: 1,
      nombre: 'Juan Pérez',
      email: 'maria.lopez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15',
      activo: true
    });
  });

  test('obtenerTodos retorna una lista de empleados', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        crearFila({ id: 1, nombre: 'Ana Gómez' }),
        crearFila({ id: 2, nombre: 'Luis Rojas', email: 'luis.rojas@empresa.com' })
      ]
    });

    const resultado = await empleadoRepository.obtenerTodos();

    expect(resultado).toHaveLength(2);
    expect(resultado[0].toJSON().nombre).toBe('Ana Gómez');
    expect(resultado[1].toJSON().email).toBe('luis.rojas@empresa.com');
  });

  test('obtenerConPaginacion construye filtros y retorna metadata', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [crearFila({ id: 7, nombre: 'Clara Torres' })] });

    const resultado = await empleadoRepository.obtenerConPaginacion({
      page: 2,
      size: 5,
      sortBy: 'nombre',
      order: 'DESC',
      q: 'clar',
      estado: 'activo'
    });

    expect(resultado).toEqual({
      items: [expect.any(Object)],
      page: 2,
      size: 5,
      totalRecords: 2,
      totalPages: 1
    });
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[0][0]).toContain('COUNT(*) as total FROM empleados');
    expect(db.query.mock.calls[1][0]).toContain('ORDER BY nombre DESC');
  });

  test('actualizar retorna null cuando el empleado no existe', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const resultado = await empleadoRepository.actualizar('10', {
      nombre: 'Nuevo Nombre',
      email: 'nuevo@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado).toBeNull();
  });

  test('actualizar retorna el empleado actualizado', async () => {
    db.query.mockResolvedValueOnce({ rows: [crearFila({ id: 10, nombre: 'Nuevo Nombre' })] });

    const resultado = await empleadoRepository.actualizar('10', {
      nombre: 'Nuevo Nombre',
      email: 'nuevo@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-02-01'
    });

    expect(resultado.toJSON().nombre).toBe('Nuevo Nombre');
  });

  test('eliminar retorna null cuando no existe el empleado', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const resultado = await empleadoRepository.eliminar('10');

    expect(resultado).toBeNull();
  });

  test('eliminar desactiva el empleado', async () => {
    db.query.mockResolvedValueOnce({ rows: [crearFila({ id: 10, activo: false })] });

    const resultado = await empleadoRepository.eliminar('10');

    expect(resultado.toJSON().activo).toBe(false);
  });

  test('reactivar retorna null cuando no existe el empleado', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const resultado = await empleadoRepository.reactivar('10');

    expect(resultado).toBeNull();
  });

  test('reactivar activa el empleado', async () => {
    db.query.mockResolvedValueOnce({ rows: [crearFila({ id: 10, activo: true })] });

    const resultado = await empleadoRepository.reactivar('10');

    expect(resultado.toJSON().activo).toBe(true);
  });
});
