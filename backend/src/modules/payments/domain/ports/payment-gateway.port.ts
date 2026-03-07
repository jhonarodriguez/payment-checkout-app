import { Result } from '../../../../shared/result';

export interface ProcessPaymentInput {
  reference: string;
  amountInCents: number;
  cardToken: string;
  acceptanceToken: string;
  customerEmail: string;
}

export interface ProcessPaymentOutput {
  gatewayId: string;
  status: 'APPROVED' | 'DECLINED' | 'PENDING' | 'ERROR';
  statusMessage: string;
}

export interface PaymentGatewayPort {
  processPayment(
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>>;
  getAcceptanceToken(): Promise<Result<string>>;
  generateIntegrityHash(reference: string, amountInCents: number): string;
}
