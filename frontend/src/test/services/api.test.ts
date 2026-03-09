import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('api — axios instance configuration', () => {
  beforeEach(() => vi.resetModules());

  function mockAxiosCapture() {
    let capturedConfig: Record<string, unknown> = {};
    vi.doMock('axios', () => ({
      default: {
        create: vi.fn((config: Record<string, unknown>) => {
          capturedConfig = config ?? {};
          return { interceptors: { response: { use: vi.fn() } } };
        }),
      },
    }));
    return { getCapturedConfig: () => capturedConfig };
  }

  it('creates an axios instance with correct config and registers the interceptor', async () => {
    const { getCapturedConfig } = mockAxiosCapture();
    await import('../../services/api');
    expect(getCapturedConfig()).toMatchObject({
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
  });

  it('uses VITE_API_URL when the env var is set', async () => {
    vi.stubEnv('VITE_API_URL', 'https://custom-api.example.com');
    const { getCapturedConfig } = mockAxiosCapture();
    await import('../../services/api');
    expect(getCapturedConfig().baseURL).toBe('https://custom-api.example.com');
    vi.unstubAllEnvs();
  });

  it('falls back to localhost URL when VITE_API_URL is not set', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const { getCapturedConfig } = mockAxiosCapture();
    await import('../../services/api');
    expect(getCapturedConfig().baseURL).toBe('http://localhost:3001/api');
    vi.unstubAllEnvs();
  });
});

describe('api — response interceptor handlers', () => {
  beforeEach(() => vi.resetModules());

  async function loadInterceptorHandlers() {
    let fulfilledHandler!: (response: unknown) => unknown;
    let rejectedHandler!: (error: unknown) => Promise<never>;

    vi.doMock('axios', () => ({
      default: {
        create: vi.fn(() => ({
          interceptors: {
            response: {
              use: vi.fn(
                (fulfilled: (r: unknown) => unknown, rejected: (e: unknown) => Promise<never>) => {
                  fulfilledHandler = fulfilled;
                  rejectedHandler = rejected;
                },
              ),
            },
          },
        })),
      },
    }));

    await import('../../services/api');
    return { fulfilledHandler, rejectedHandler };
  }

  it('success handler returns the response unchanged', async () => {
    const { fulfilledHandler } = await loadInterceptorHandlers();
    const response = { data: { foo: 'bar' }, status: 200 };
    expect(fulfilledHandler(response)).toBe(response);
  });

  it('uses response.data.message when present', async () => {
    const { rejectedHandler } = await loadInterceptorHandlers();
    const err = { response: { data: { message: 'Server error' } }, message: 'Generic' };
    await expect(rejectedHandler(err)).rejects.toThrow('Server error');
  });

  it('falls back to error.message when no response body', async () => {
    const { rejectedHandler } = await loadInterceptorHandlers();
    const err = { message: 'Network timeout' };
    await expect(rejectedHandler(err)).rejects.toThrow('Network timeout');
  });

  it('uses default message when neither response nor message is present', async () => {
    const { rejectedHandler } = await loadInterceptorHandlers();
    await expect(rejectedHandler({})).rejects.toThrow('Error de conexión con el servidor');
  });
});
