const { validarEmpleado, isBlank, emailBasicoValido } = require('../../src/validators/empleadoValidator');

describe('empleadoValidator', () => {
  test('datos válidos pasan validación sin errores', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toEqual([]);
  });

  test.each([
    'juan@',
    '@empresa.com',
    'juan@empresa'
  ])('email inválido %s falla validación', (email) => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email,
      departamentoId: '10',
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toContain('email inválido');
  });

  test('email con formato válido pasa validación', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toEqual([]);
  });

  test('nombre vacío falla validación', () => {
    const errores = validarEmpleado({
      nombre: '   ',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toContain('nombre es requerido');
  });

  test('fechaIngreso ausente falla validación', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: null
    });

    expect(errores).toContain('fechaIngreso es requerido');
  });

  test.each([
    '32-13-2024',
    'hola',
    '2024-13-01'
  ])('fechaIngreso inválida %s falla validación', (fechaIngreso) => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso
    });

    expect(errores).toContain('fechaIngreso inválido');
  });

  test('fechaIngreso con formato válido pasa validación', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toEqual([]);
  });

  test('email ausente falla validación', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: null,
      departamentoId: '10',
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toContain('email es requerido');
  });

  test('departamentoId ausente falla validación', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: undefined,
      fechaIngreso: '2024-01-15'
    });

    expect(errores).toContain('departamentoId es requerido');
  });

  test('fechaIngreso no textual falla validación', () => {
    const errores = validarEmpleado({
      nombre: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      departamentoId: '10',
      fechaIngreso: 20240115
    });

    expect(errores).toContain('fechaIngreso inválido');
  });

  test('isBlank reconoce valores vacíos', () => {
    expect(isBlank(undefined)).toBe(true);
    expect(isBlank(null)).toBe(true);
    expect(isBlank('   ')).toBe(true);
    expect(isBlank('texto')).toBe(false);
  });

  test('emailBasicoValido valida y rechaza formatos incompletos', () => {
    expect(emailBasicoValido('juan.perez@empresa.com')).toBe(true);
    expect(emailBasicoValido('juan@')).toBe(false);
    expect(emailBasicoValido('@empresa.com')).toBe(false);
    expect(emailBasicoValido('juan@empresa')).toBe(false);
  });
});
