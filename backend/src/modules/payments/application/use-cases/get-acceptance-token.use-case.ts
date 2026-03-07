import { Injectable, Inject } from '@nestjs/common';
import { PaymentGatewayPort } from '../../domain/ports/payment-gateway.port';
import { Result } from '../../../../shared/result';

@Injectable()
export class GetAcceptanceTokenUseCase {
  constructor(
    @Inject('PAYMENT_GATEWAY')
    private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(): Promise<Result<string>> {
    return this.paymentGateway.getAcceptanceToken();
  }
}
