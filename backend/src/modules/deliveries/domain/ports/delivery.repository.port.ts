export interface DeliveryRepositoryPort {
  create(data: {
    transactionId: string;
    customerId: string;
    address: string;
    city: string;
    department: string;
  }): Promise<any>;

  findByTransactionId(transactionId: string): Promise<any | null>;
}
