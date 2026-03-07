import { TransactionStatus } from '../../infrastructure/adapters/transaction.entity';

export interface TransactionRepositoryPort {
  create(data: {
    reference: string;
    customerId: string;
    productId: string;
    productAmountInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalInCents: number;
    status: TransactionStatus;
    cardLastFour: string;
  }): Promise<any>;

  findById(id: string): Promise<any | null>;

  updateStatus(
    id: string,
    status: TransactionStatus,
    gatewayTransactionId: string | null,
  ): Promise<void>;
}
