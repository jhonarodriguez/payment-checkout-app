import { WompiAdapter } from './wompi.adapter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeConfigService = (): jest.Mocked<ConfigService> =>
  ({
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        PAYMENT_API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
        PAYMENT_PUBLIC_KEY: 'pub_test_key',
        PAYMENT_PRIVATE_KEY: 'prv_test_key',
        PAYMENT_INTEGRITY_KEY: 'integrity_key_test',
      };
      return config[key];
    }),
  }) as any;

describe('WompiAdapter', () => {
  let adapter: WompiAdapter;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    configService = makeConfigService();
    adapter = new WompiAdapter(configService);
  });

  describe('getAcceptanceToken', () => {
    it('returns ok result with token when API responds correctly', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({
        data: {
          data: {
            presigned_acceptance: {
              acceptance_token: 'tok_acceptance_123',
            },
          },
        },
      });

      const result = await adapter.getAcceptanceToken();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('tok_acceptance_123');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api-sandbox.co.uat.wompi.dev/v1/merchants/pub_test_key',
      );
    });

    it('returns fail when token is missing from response', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({
        data: { data: {} },
      });

      const result = await adapter.getAcceptanceToken();

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('No se pudo obtener el acceptance_token');
    });

    it('returns fail when response data is null', async () => {
      mockedAxios.get = jest.fn().mockResolvedValue({ data: null });

      const result = await adapter.getAcceptanceToken();

      expect(result.isFailure).toBe(true);
    });

    it('returns fail when axios throws an Error', async () => {
      mockedAxios.get = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await adapter.getAcceptanceToken();

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Network error');
    });

    it('wraps non-Error thrown values', async () => {
      mockedAxios.get = jest.fn().mockRejectedValue('timeout');

      const result = await adapter.getAcceptanceToken();

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error al conectar con la pasarela de pago');
    });
  });

  describe('generateIntegrityHash', () => {
    it('generates a consistent SHA256 hash', () => {
      const hash1 = adapter.generateIntegrityHash('REF-001', 10000);
      const hash2 = adapter.generateIntegrityHash('REF-001', 10000);
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('generates different hashes for different references', () => {
      const hash1 = adapter.generateIntegrityHash('REF-001', 10000);
      const hash2 = adapter.generateIntegrityHash('REF-002', 10000);
      expect(hash1).not.toBe(hash2);
    });

    it('generates different hashes for different amounts', () => {
      const hash1 = adapter.generateIntegrityHash('REF-001', 10000);
      const hash2 = adapter.generateIntegrityHash('REF-001', 20000);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('processPayment', () => {
    const paymentInput = {
      reference: 'TXN-001',
      amountInCents: 15000000,
      cardToken: 'tok_card_test',
      acceptanceToken: 'tok_accept_test',
      customerEmail: 'user@example.com',
    };

    it('returns ok result with payment data on success', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          data: {
            id: 'gw-txn-123',
            status: 'APPROVED',
            status_message: 'Aprobado',
          },
        },
      });

      const result = await adapter.processPayment(paymentInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.gatewayId).toBe('gw-txn-123');
      expect(result.value.status).toBe('APPROVED');
      expect(result.value.statusMessage).toBe('Aprobado');
    });

    it('uses status as statusMessage when status_message is absent', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: {
          data: {
            id: 'gw-txn-456',
            status: 'DECLINED',
          },
        },
      });

      const result = await adapter.processPayment(paymentInput);

      expect(result.isSuccess).toBe(true);
      expect(result.value.statusMessage).toBe('DECLINED');
    });

    it('returns fail when transaction data is missing', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({ data: {} });

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Respuesta inválida de la pasarela de pago');
    });

    it('returns fail with messages array from AxiosError', async () => {
      const axiosError = Object.assign(new Error('Axios error'), {
        isAxiosError: true,
        response: {
          data: {
            error: {
              messages: ['Card declined', 'Insufficient funds'],
            },
          },
        },
      });
      // Make it pass the AxiosError instanceof check
      const { AxiosError } = await import('axios');
      Object.setPrototypeOf(axiosError, AxiosError.prototype);
      mockedAxios.post = jest.fn().mockRejectedValue(axiosError);

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Card declined');
    });

    it('returns fail with string messages from AxiosError', async () => {
      const axiosError = Object.assign(new Error('Axios error'), {
        isAxiosError: true,
        response: {
          data: {
            error: {
              messages: 'Declined by bank',
            },
          },
        },
      });
      const { AxiosError } = await import('axios');
      Object.setPrototypeOf(axiosError, AxiosError.prototype);
      mockedAxios.post = jest.fn().mockRejectedValue(axiosError);

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Declined by bank');
    });

    it('returns fail with error type when no messages', async () => {
      const axiosError = Object.assign(new Error('Axios error'), {
        isAxiosError: true,
        response: {
          data: {
            error: {
              type: 'VALIDATION_ERROR',
            },
          },
        },
      });
      const { AxiosError } = await import('axios');
      Object.setPrototypeOf(axiosError, AxiosError.prototype);
      mockedAxios.post = jest.fn().mockRejectedValue(axiosError);

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('VALIDATION_ERROR');
    });

    it('returns generic payment error when AxiosError has no error body', async () => {
      const axiosError = Object.assign(new Error('Axios error'), {
        isAxiosError: true,
        response: { data: {} },
      });
      const { AxiosError } = await import('axios');
      Object.setPrototypeOf(axiosError, AxiosError.prototype);
      mockedAxios.post = jest.fn().mockRejectedValue(axiosError);

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error al procesar el pago');
    });

    it('returns fail when a non-axios Error is thrown', async () => {
      mockedAxios.post = jest.fn().mockRejectedValue(new Error('Generic error'));

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Generic error');
    });

    it('wraps non-Error thrown values', async () => {
      mockedAxios.post = jest.fn().mockRejectedValue(null);

      const result = await adapter.processPayment(paymentInput);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error desconocido en el pago');
    });

    it('sends correct payload to Wompi API', async () => {
      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { data: { id: 'gw-1', status: 'APPROVED' } },
      });

      await adapter.processPayment(paymentInput);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-sandbox.co.uat.wompi.dev/v1/transactions',
        expect.objectContaining({
          reference: 'TXN-001',
          amount_in_cents: 15000000,
          currency: 'COP',
          customer_email: 'user@example.com',
          acceptance_token: 'tok_accept_test',
          payment_method: expect.objectContaining({
            type: 'CARD',
            token: 'tok_card_test',
            installments: 1,
          }),
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer prv_test_key',
          }),
        }),
      );
    });
  });
});
