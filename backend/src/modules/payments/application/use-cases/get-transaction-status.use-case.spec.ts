import { GetTransactionStatusUseCase } from './get-transaction-status.use-case';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeConfigService = (): jest.Mocked<ConfigService> =>
  ({
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        PAYMENT_API_URL: 'https://api-sandbox.co.uat.wompi.dev/v1',
        PAYMENT_PRIVATE_KEY: 'prv_test_key',
      };
      return config[key];
    }),
  }) as any;

describe('GetTransactionStatusUseCase', () => {
  let useCase: GetTransactionStatusUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GetTransactionStatusUseCase(makeConfigService());
  });

  it('returns ok result with status data when API responds', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        data: {
          status: 'APPROVED',
          status_message: 'Aprobado',
        },
      },
    });

    const result = await useCase.execute('gw-txn-123');

    expect(result.isSuccess).toBe(true);
    expect(result.value.status).toBe('APPROVED');
    expect(result.value.statusMessage).toBe('Aprobado');
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api-sandbox.co.uat.wompi.dev/v1/transactions/gw-txn-123',
      expect.objectContaining({
        headers: { Authorization: 'Bearer prv_test_key' },
      }),
    );
  });

  it('uses status as statusMessage when status_message is absent', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({
      data: {
        data: { status: 'DECLINED' },
      },
    });

    const result = await useCase.execute('gw-txn-456');

    expect(result.isSuccess).toBe(true);
    expect(result.value.statusMessage).toBe('DECLINED');
  });

  it('returns fail when transaction data is missing', async () => {
    mockedAxios.get = jest.fn().mockResolvedValue({ data: {} });

    const result = await useCase.execute('gw-txn-789');

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe('Transacción no encontrada en Wompi');
  });

  it('returns fail with error type when axios throws with response data', async () => {
    const error = {
      response: {
        data: { error: { type: 'TRANSACTION_NOT_FOUND' } },
      },
    };
    mockedAxios.get = jest.fn().mockRejectedValue(error);

    const result = await useCase.execute('gw-txn-bad');

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe('TRANSACTION_NOT_FOUND');
  });

  it('returns generic error message when response has no error type', async () => {
    mockedAxios.get = jest.fn().mockRejectedValue(new Error('Network fail'));

    const result = await useCase.execute('gw-txn-bad');

    expect(result.isFailure).toBe(true);
    expect(result.error.message).toBe('Error al consultar el estado');
  });
});
