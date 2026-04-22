jest.mock('opossum', () => {
  return jest.fn().mockImplementation(function (action, options) {
    this.action = action;
    this.options = options;
    this.stats = {
      successes: 0,
      failures: 0,
      fallbacks: 0,
      timeouts: 0,
      rejects: 0,
      fires: 0,
      latencyMean: 0,
      percentiles: {}
    };
    this.opened = false;
    this.closed = true;
    this.halfOpen = false;
    this.fire = jest.fn();
    this.fallback = jest.fn();
    this.on = jest.fn();
  });
});

jest.mock('../../src/utils/httpClient', () => ({
  httpGet: jest.fn()
}));

const { httpGet } = require('../../src/utils/httpClient');
const { httpGetWithCircuitBreaker, getCircuitBreakerStats, circuitBreaker } = require('../../src/utils/circuitBreakerClient');

describe('circuitBreakerClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    circuitBreaker.stats = {
      successes: 3,
      failures: 1,
      fallbacks: 0,
      timeouts: 0,
      rejects: 0,
      fires: 4,
      latencyMean: 12,
      percentiles: { '0.5': 10 }
    };
    circuitBreaker.opened = false;
    circuitBreaker.closed = true;
    circuitBreaker.halfOpen = false;
  });

  test('httpGetWithCircuitBreaker delega la llamada al breaker', async () => {
    circuitBreaker.fire.mockResolvedValueOnce({
      statusCode: 200,
      ok: true,
      data: { id: '1' }
    });

    const resultado = await httpGetWithCircuitBreaker('http://localhost:8081/departamentos/1', {
      timeout: 3000
    });

    expect(resultado).toEqual({
      statusCode: 200,
      ok: true,
      data: { id: '1' }
    });
    expect(circuitBreaker.fire).toHaveBeenCalledWith('http://localhost:8081/departamentos/1', { timeout: 3000 });
    expect(httpGet).not.toHaveBeenCalled();
  });

  test('getCircuitBreakerStats refleja estado OPEN', () => {
    circuitBreaker.opened = true;
    circuitBreaker.closed = false;
    circuitBreaker.halfOpen = false;

    const stats = getCircuitBreakerStats();

    expect(stats).toEqual(expect.objectContaining({
      name: 'departamentos-service-breaker',
      state: 'OPEN',
      isOpen: true,
      isClosed: false,
      isHalfOpen: false
    }));
    expect(stats.stats).toEqual(expect.objectContaining({
      successes: 3,
      failures: 1,
      fires: 4
    }));
  });
});
