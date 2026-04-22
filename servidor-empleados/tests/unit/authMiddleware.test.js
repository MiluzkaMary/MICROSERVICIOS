jest.mock('jsonwebtoken', () => ({
  verify: jest.fn()
}));

const jwt = require('jsonwebtoken');
const { requiereAuth, requiereAdmin } = require('../../src/middlewares/authMiddleware');

function crearRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
}

function crearErrorJwt(nombre = 'JsonWebTokenError', message = 'Token inválido') {
  const error = new Error(message);
  error.name = nombre;
  return error;
}

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('request sin header Authorization responde 401', () => {
    const req = { headers: {}, url: '/empleados', method: 'GET' };
    const res = crearRes();
    const next = jest.fn();

    requiereAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      statusCode: 401,
      code: 'TOKEN_MISSING'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('request con token malformado responde 401', () => {
    jwt.verify.mockImplementation(() => {
      throw crearErrorJwt();
    });

    const req = {
      headers: { authorization: 'Bearer token-malformado' },
      originalUrl: '/empleados',
      method: 'GET'
    };
    const res = crearRes();
    const next = jest.fn();

    requiereAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'TOKEN_INVALID',
      message: 'Token inválido o malformado.'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('request con token válido de USER agrega usuario al request y llama next', () => {
    jwt.verify.mockReturnValue({ sub: 'emp-1', role: 'USER' });

    const req = {
      headers: { authorization: 'Bearer user-token' },
      originalUrl: '/empleados',
      method: 'GET'
    };
    const res = crearRes();
    const next = jest.fn();

    requiereAuth(req, res, next);

    expect(req.usuario).toEqual({ empleadoId: 'emp-1', role: 'USER' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('request con token válido de ADMIN agrega usuario con role ADMIN y llama next', () => {
    jwt.verify.mockReturnValue({ sub: 'emp-2', role: 'ADMIN' });

    const req = {
      headers: { authorization: 'Bearer admin-token' },
      originalUrl: '/empleados',
      method: 'POST'
    };
    const res = crearRes();
    const next = jest.fn();

    requiereAuth(req, res, next);

    expect(req.usuario).toEqual({ empleadoId: 'emp-2', role: 'ADMIN' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('requiereAdmin responde 403 cuando el rol no es ADMIN', () => {
    const req = {
      usuario: { empleadoId: 'emp-1', role: 'USER' },
      originalUrl: '/empleados',
      method: 'POST'
    };
    const res = crearRes();
    const next = jest.fn();

    requiereAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      code: 'INSUFFICIENT_PERMISSIONS'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  test('requiereAdmin permite el acceso cuando el rol es ADMIN', () => {
    const req = {
      usuario: { empleadoId: 'emp-2', role: 'ADMIN' },
      originalUrl: '/empleados',
      method: 'POST'
    };
    const res = crearRes();
    const next = jest.fn();

    requiereAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
