import { TransactionController } from './transaction.controller';
import { ProcessPaymentUseCase } from '../application/use-cases/process-payment.use-case';
import { GetTransactionStatusUseCase } from '../../payments/application/use-cases/get-transaction-status.use-case';
import { TransactionEntity, TransactionStatus } from './adapters/transaction.entity';
import { Repository } from 'typeorm';
import { ProductRepositoryPort } from '../../products/domain/ports/product.repository.port';
import { DeliveryRepositoryPort } from '../../deliveries/domain/ports/delivery.repository.port';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Result } from '../../../shared/result';
import { HttpStatus } from '@nestjs/common';

const makeTransactionEntity = (
  status = TransactionStatus.PENDING,
  gatewayTransactionId: string | null = null,
): TransactionEntity => ({
  id: 'txn-uuid-1',
  reference: 'TXN-001',
  customer: null as any,
  customerId: 'cust-1',
  product: null as any,
  productId: 'prod-1',
  productAmountInCents: 15000000,
  baseFeeInCents: 300000,
  deliveryFeeInCents: 200000,
  totalInCents: 15500000,
  status,
  gatewayTransactionId,
  cardLastFour: '4242',
  deliveryAddress: 'Calle 123',
  deliveryCity: 'Bogotá',
  deliveryDepartment: 'Cundinamarca',
  createdAt: new Date(),
  updatedAt: new Date(),
});

const makeResponse = () => {
  const json = jest.fn().mockReturnThis();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json } as any;
};

const makeDto = (): CreateTransactionDto => ({
  productId: 'prod-uuid-1',
  customerName: 'Juan Pérez',
  customerEmail: 'test@example.com',
  deliveryAddress: 'Calle 123',
  deliveryCity: 'Bogotá',
  deliveryDepartment: 'Cundinamarca',
  cardToken: 'tok_card',
  acceptanceToken: 'tok_accept',
  cardLastFour: '4242',
});

describe('TransactionController', () => {
  let controller: TransactionController;
  let processPaymentUseCase: jest.Mocked<ProcessPaymentUseCase>;
  let getTransactionStatusUseCase: jest.Mocked<GetTransactionStatusUseCase>;
  let repo: jest.Mocked<Repository<TransactionEntity>>;
  let productRepo: jest.Mocked<ProductRepositoryPort>;
  let deliveryRepo: jest.Mocked<DeliveryRepositoryPort>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    processPaymentUseCase = { execute: jest.fn() } as any;
    getTransactionStatusUseCase = { execute: jest.fn() } as any;

    mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    repo = {
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };

    deliveryRepo = {
      create: jest.fn(),
      findByTransactionId: jest.fn(),
    };

    controller = new TransactionController(
      processPaymentUseCase,
      getTransactionStatusUseCase,
      repo,
      productRepo as any,
      deliveryRepo as any,
    );
  });

  describe('create', () => {
    it('returns 201 with transaction data on success', async () => {
      const txData = { transactionId: 'txn-1', status: 'APPROVED' };
      processPaymentUseCase.execute.mockResolvedValue(Result.ok(txData));
      const res = makeResponse();

      await controller.create(makeDto(), res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.status(HttpStatus.CREATED).json).toHaveBeenCalledWith({
        success: true,
        data: txData,
      });
    });

    it('returns 402 when payment processing fails', async () => {
      processPaymentUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Pago rechazado')),
      );
      const res = makeResponse();

      await controller.create(makeDto(), res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.PAYMENT_REQUIRED);
      expect(res.status(HttpStatus.PAYMENT_REQUIRED).json).toHaveBeenCalledWith({
        success: false,
        message: 'Pago rechazado',
      });
    });
  });

  describe('findOne', () => {
    it('returns 200 with transaction when found', async () => {
      const entity = makeTransactionEntity();
      repo.findOne.mockResolvedValue(entity);
      const res = makeResponse();

      await controller.findOne('txn-uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 'txn-uuid-1' },
        relations: ['customer', 'product'],
      });
    });

    it('returns 404 when transaction not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const res = makeResponse();

      await controller.findOne('nonexistent', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.status(HttpStatus.NOT_FOUND).json).toHaveBeenCalledWith({
        success: false,
        message: 'Transacción no encontrada',
      });
    });
  });

  describe('checkStatus', () => {
    it('returns 404 when transaction not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const res = makeResponse();

      await controller.checkStatus('nonexistent', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('returns final status directly without calling gateway for APPROVED', async () => {
      const entity = makeTransactionEntity(TransactionStatus.APPROVED, 'gw-123');
      repo.findOne.mockResolvedValue(entity);
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(getTransactionStatusUseCase.execute).not.toHaveBeenCalled();
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: {
          transactionId: 'txn-uuid-1',
          status: TransactionStatus.APPROVED,
          gatewayTransactionId: 'gw-123',
        },
      });
    });

    it('returns PENDING when no gatewayTransactionId', async () => {
      const entity = makeTransactionEntity(TransactionStatus.PENDING, null);
      repo.findOne.mockResolvedValue(entity);
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(getTransactionStatusUseCase.execute).not.toHaveBeenCalled();
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: { transactionId: 'txn-uuid-1', status: 'PENDING' },
      });
    });

    it('returns PENDING when gateway status query fails', async () => {
      const entity = makeTransactionEntity(TransactionStatus.PENDING, 'gw-123');
      repo.findOne.mockResolvedValue(entity);
      getTransactionStatusUseCase.execute.mockResolvedValue(
        Result.fail(new Error('Gateway error')),
      );
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: { transactionId: 'txn-uuid-1', status: 'PENDING' },
      });
    });

    it('updates status and creates delivery when gateway returns APPROVED', async () => {
      const entity = makeTransactionEntity(TransactionStatus.PENDING, 'gw-123');
      repo.findOne.mockResolvedValue(entity);
      getTransactionStatusUseCase.execute.mockResolvedValue(
        Result.ok({ status: 'APPROVED', statusMessage: 'Aprobado' }),
      );
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      productRepo.decrementStock.mockResolvedValue(undefined);
      deliveryRepo.create.mockResolvedValue({} as any);
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(repo.createQueryBuilder).toHaveBeenCalled();
      expect(productRepo.decrementStock).toHaveBeenCalledWith('prod-1');
      expect(deliveryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'txn-uuid-1',
          customerId: 'cust-1',
          address: 'Calle 123',
          city: 'Bogotá',
        }),
      );
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });

    it('returns status without delivery when updateResult.affected is 0', async () => {
      const entity = makeTransactionEntity(TransactionStatus.PENDING, 'gw-123');
      repo.findOne.mockResolvedValue(entity);
      getTransactionStatusUseCase.execute.mockResolvedValue(
        Result.ok({ status: 'APPROVED', statusMessage: 'Aprobado' }),
      );
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(deliveryRepo.create).not.toHaveBeenCalled();
      expect(productRepo.decrementStock).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: { transactionId: 'txn-uuid-1', status: 'APPROVED' },
      });
    });

    it('returns current status when gateway returns non-final status', async () => {
      const entity = makeTransactionEntity(TransactionStatus.PENDING, 'gw-123');
      repo.findOne.mockResolvedValue(entity);
      getTransactionStatusUseCase.execute.mockResolvedValue(
        Result.ok({ status: 'PENDING', statusMessage: 'Pendiente' }),
      );
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(repo.createQueryBuilder).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.status(HttpStatus.OK).json).toHaveBeenCalledWith({
        success: true,
        data: { transactionId: 'txn-uuid-1', status: 'PENDING' },
      });
    });

    it('handles DECLINED final status from gateway without delivery', async () => {
      const entity = makeTransactionEntity(TransactionStatus.PENDING, 'gw-456');
      repo.findOne.mockResolvedValue(entity);
      getTransactionStatusUseCase.execute.mockResolvedValue(
        Result.ok({ status: 'DECLINED', statusMessage: 'Declinado' }),
      );
      mockQueryBuilder.execute.mockResolvedValue({ affected: 1 });
      const res = makeResponse();

      await controller.checkStatus('txn-uuid-1', res);

      expect(productRepo.decrementStock).not.toHaveBeenCalled();
      expect(deliveryRepo.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });
});
