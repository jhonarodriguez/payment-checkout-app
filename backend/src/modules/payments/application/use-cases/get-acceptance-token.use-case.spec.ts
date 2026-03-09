import { GetAcceptanceTokenUseCase } from './get-acceptance-token.use-case';
import { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { Result } from '../../../../shared/result';

describe('GetAcceptanceTokenUseCase', () => {
  let useCase: GetAcceptanceTokenUseCase;
  let mockGateway: jest.Mocked<PaymentGatewayPort>;

  beforeEach(() => {
    mockGateway = {
      getAcceptanceToken: jest.fn(),
      processPayment: jest.fn(),
      generateIntegrityHash: jest.fn(),
    };
    useCase = new GetAcceptanceTokenUseCase(mockGateway as any);
  });

  it('returns the result from the payment gateway directly', async () => {
    const token = 'tok_acceptance_abc123';
    mockGateway.getAcceptanceToken.mockResolvedValue(Result.ok(token));

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(token);
    expect(mockGateway.getAcceptanceToken).toHaveBeenCalledTimes(1);
  });

  it('propagates failure from the payment gateway', async () => {
    const error = new Error('Gateway unavailable');
    mockGateway.getAcceptanceToken.mockResolvedValue(Result.fail(error));

    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });
});
