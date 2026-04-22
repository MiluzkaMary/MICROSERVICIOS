jest.mock('http', () => ({
  request: jest.fn()
}));

const { EventEmitter } = require('events');
const http = require('http');
const { httpGet } = require('../../src/utils/httpClient');

function crearRequestMock() {
  const req = new EventEmitter();
  req.end = jest.fn();
  req.destroy = jest.fn();
  return req;
}

describe('httpClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('httpGet retorna la respuesta JSON parseada', async () => {
    http.request.mockImplementation((options, callback) => {
      const req = crearRequestMock();
      const res = new EventEmitter();
      res.statusCode = 200;

      process.nextTick(() => {
        callback(res);
        res.emit('data', '{"ok":true}');
        res.emit('end');
      });

      return req;
    });

    const resultado = await httpGet('http://localhost:8081/departamentos/1', {
      timeout: 3000,
      retries: 0,
      headers: { Authorization: 'Bearer token' }
    });

    expect(resultado).toEqual({
      statusCode: 200,
      data: { ok: true },
      ok: true
    });
    expect(http.request).toHaveBeenCalledTimes(1);
  });

  test('httpGet lanza error de red cuando falla la petición', async () => {
    http.request.mockImplementation((options, callback) => {
      const req = crearRequestMock();
      process.nextTick(() => {
        req.emit('error', new Error('boom'));
      });
      return req;
    });

    await expect(
      httpGet('http://localhost:8081/departamentos/1', {
        timeout: 3000,
        retries: 0
      })
    ).rejects.toThrow('Error de red: boom');
  });
});
