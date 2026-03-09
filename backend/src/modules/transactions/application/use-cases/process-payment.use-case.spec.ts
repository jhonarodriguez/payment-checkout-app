import { ProcessPaymentUseCase } from './process-payment.use-case';
import { ProductRepositoryPort } from '../../../products/domain/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/domain/ports/customer.repository.port';
import { PaymentGatewayPort } from '../../../payments/domain/ports/payment-gateway.port';
import { TransactionRepositoryPort } from '../../domain/ports/transaction.repository.port';
import { DeliveryRepositoryPort } from '../../../deliveries/domain/ports/delivery.repository.port';
import { ConfigService } from '@nestjs/config';
import { CreateTransactionDto } from '../../infrastructure/dto/create-transaction.dto';
import { Product } from '../../../products/domain/entities/product';
import { TransactionStatus } from '../../infrastructure/adapters/transaction.entity';
import { Result } from '../../../../shared/result';
import { NotFoundError, ValidationError } from '../../../../shared/errors/domain-errors';

const makeProduct = (stock = 3) =>
  new Product(
    'prod-uuid-1',
    'Producto Test',
    'Descripción',
    15000000,
    'img.jpg',
    stock,
    new Date(),
  );

const makeCustomer = () => ({ id: 'cust-uuid-1', email: 'test@example.com' });
const makeTransaction = () => ({
  id: 'txn-uuid-1',
  reference: 'TXN-001',
  status: TransactionStatus.PENDING,
});

const makeDto = (overrides: Partial<CreateTransactionDto> = {}): CreateTransactionDto => ({
  productId: 'prod-uuid-1',
  customerName: 'Juan Pérez',
  customerEmail: 'test@example.com',
  deliveryAddress: 'Calle 123',
  deliveryCity: 'Bogotá',
  deliveryDepartment: 'Cundinamarca',
  cardToken: 'tok_card_test',
  acceptanceToken: 'tok_accept_test',
  cardLastFour: '4242',
  ...overrides,
});

describe('ProcessPaymentUseCase', () => {
  let useCase: ProcessPaymentUseCase;
  let transactionRepo: jest.Mocked<TransactionRepositoryPort>;
  let productRepo: jest.Mocked<ProductRepositoryPort>;
  let customerRepo: jest.Mocked<CustomerRepositoryPort>;
  let deliveryRepo: jest.Mocked<DeliveryRepositoryPort>;
  let paymentGateway: jest.Mocked<PaymentGatewayPort>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    transactionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    productRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };
    customerRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    deliveryRepo = {
      create: jest.fn(),
      findByTransactionId: jest.fn(),
    };
    paymentGateway = {
      getAcceptanceToken: jest.fn(),
      processPayment: jest.fn(),
      generateIntegrityHash: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'BASE_FEE_IN_CENTS') return 300000;
        if (key === 'DELIVERY_FEE_IN_CENTS') return 200000;
        return null;
      }),
    } as any;

    useCase = new ProcessPaymentUseCase(
      transactionRepo as any,
      productRepo as any,
      customerRepo as any,
      deliveryRepo as any,
      paymentGateway as any,
      configService,
    );
  });

  describe('successful payment - APPROVED', () => {
    it('completes the full payment flow and returns transaction data', async () => {
      const product = makeProduct(3);
      const customer = makeCustomer();
      const transaction = makeTransaction();

      productRepo.findById.mockResolvedValue(product);
      customerRepo.findByEmail.mockResolvedValue(customer);
      transactionRepo.create.mockResolvedValue(transaction);
      paymentGateway.processPayment.mockResolvedValue(
        Result.ok({ gatewayId: 'gw-123', status: 'APPROVED', statusMessage: 'Aprobado' }),
      );
      transactionRepo.updateStatus.mockResolvedValue(undefined);
      deliveryRepo.create.mockResolvedValue({} as any);
      productRepo.decrementStock.mockResolvedValue(undefined);

      const result = await useCase.execute(makeDto());

      expect(result.isSuccess).toBe(true);
      expect(result.value.transactionId).toBe('txn-uuid-1');
      expect(result.value.status).toBe('APPROVED');
      expect(result.value.totalInCents).toBe(15000000 + 300000 + 200000);

      expect(transactionRepo.updateStatus).toHaveBeenCalledWith(
        'txn-uuid-1',
        'APPROVED',
        'gw-123',
      );
      expect(deliveryRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'txn-uuid-1',
          customerId: 'cust-uuid-1',
          address: 'Calle 123',
          city: 'Bogotá',
        }),
      );
      expect(productRepo.decrementStock).toHaveBeenCalledWith('prod-uuid-1');
    });

    it('creates a new customer when email not found', async () => {
      const product = makeProduct();
      const newCustomer = { id: 'new-cust', email: 'new@example.com' };
      const transaction = makeTransaction();

      productRepo.findById.mockResolvedValue(product);
      customerRepo.findByEmail.mockResolvedValue(null);
      customerRepo.create.mockResolvedValue(newCustomer);
      transactionRepo.create.mockResolvedValue(transaction);
      paymentGateway.processPayment.mockResolvedValue(
        Result.ok({ gatewayId: 'gw-456', status: 'APPROVED', statusMessage: 'OK' }),
      );
      transactionRepo.updateStatus.mockResolvedValue(undefined);
      deliveryRepo.create.mockResolvedValue({} as any);
      productRepo.decrementStock.mockResolvedValue(undefined);

      const result = await useCase.execute(makeDto({ customerEmail: 'new@example.com' }));

      expect(result.isSuccess).toBe(true);
      expect(customerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
    });
  });

  describe('payment declined / non-approved', () => {
    it('does NOT create delivery or decrement stock when status is DECLINED', async () => {
      const product = makeProduct();
      const customer = makeCustomer();
      const transaction = makeTransaction();

      productRepo.findById.mockResolvedValue(product);
      customerRepo.findByEmail.mockResolvedValue(customer);
      transactionRepo.create.mockResolvedValue(transaction);
      paymentGateway.processPayment.mockResolvedValue(
        Result.ok({ gatewayId: 'gw-789', status: 'DECLINED', statusMessage: 'Declinado' }),
      );
      transactionRepo.updateStatus.mockResolvedValue(undefined);

      const result = await useCase.execute(makeDto());

      expect(result.isSuccess).toBe(true);
      expect(result.value.status).toBe('DECLINED');
      expect(deliveryRepo.create).not.toHaveBeenCalled();
      expect(productRepo.decrementStock).not.toHaveBeenCalled();
    });
  });

  describe('error paths - product validation', () => {
    it('returns fail with ValidationError when productId is empty', async () => {
      const result = await useCase.execute(makeDto({ productId: '' }));

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(ValidationError);
      expect(productRepo.findById).not.toHaveBeenCalled();
    });

    it('returns fail with NotFoundError when product does not exist', async () => {
      productRepo.findById.mockResolvedValue(null);

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(NotFoundError);
    });

    it('returns fail when product has no stock', async () => {
      productRepo.findById.mockResolvedValue(makeProduct(0));

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('El producto no tiene stock disponible');
    });

    it('wraps errors from product repository', async () => {
      productRepo.findById.mockRejectedValue(new Error('DB error'));

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('DB error');
    });

    it('wraps non-Error from product repository', async () => {
      productRepo.findById.mockRejectedValue('unexpected');

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error al verificar el producto');
    });
  });

  describe('error paths - customer', () => {
    it('returns fail when customer repository throws', async () => {
      productRepo.findById.mockResolvedValue(makeProduct());
      customerRepo.findByEmail.mockRejectedValue(new Error('Customer DB error'));

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Customer DB error');
    });

    it('wraps non-Error from customer repository', async () => {
      productRepo.findById.mockResolvedValue(makeProduct());
      customerRepo.findByEmail.mockRejectedValue(null);

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error al procesar los datos del cliente');
    });
  });

  describe('error paths - transaction creation', () => {
    it('returns fail when transaction creation throws', async () => {
      productRepo.findById.mockResolvedValue(makeProduct());
      customerRepo.findByEmail.mockResolvedValue(makeCustomer());
      transactionRepo.create.mockRejectedValue(new Error('TX create failed'));

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('TX create failed');
    });

    it('wraps non-Error from transaction creation', async () => {
      productRepo.findById.mockResolvedValue(makeProduct());
      customerRepo.findByEmail.mockResolvedValue(makeCustomer());
      transactionRepo.create.mockRejectedValue(undefined);

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error al crear la transacción');
    });
  });

  describe('error paths - payment gateway', () => {
    it('updates transaction to ERROR and returns fail when payment gateway fails', async () => {
      productRepo.findById.mockResolvedValue(makeProduct());
      customerRepo.findByEmail.mockResolvedValue(makeCustomer());
      transactionRepo.create.mockResolvedValue(makeTransaction());
      paymentGateway.processPayment.mockResolvedValue(
        Result.fail(new Error('Payment declined')),
      );
      transactionRepo.updateStatus.mockResolvedValue(undefined);

      const result = await useCase.execute(makeDto());

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Error al conectar con la pasarela de pago');
      expect(transactionRepo.updateStatus).toHaveBeenCalledWith(
        'txn-uuid-1',
        TransactionStatus.ERROR,
        null,
      );
    });
  });

  describe('fee calculation', () => {
    it('uses default fees when config returns falsy values', async () => {
      const configWithDefaults = {
        get: jest.fn().mockReturnValue(undefined),
      } as any;

      const useCaseWithDefaults = new ProcessPaymentUseCase(
        transactionRepo as any,
        productRepo as any,
        customerRepo as any,
        deliveryRepo as any,
        paymentGateway as any,
        configWithDefaults,
      );

      productRepo.findById.mockResolvedValue(makeProduct());
      customerRepo.findByEmail.mockResolvedValue(makeCustomer());
      transactionRepo.create.mockResolvedValue(makeTransaction());
      paymentGateway.processPayment.mockResolvedValue(
        Result.ok({ gatewayId: 'gw-1', status: 'APPROVED', statusMessage: 'OK' }),
      );
      transactionRepo.updateStatus.mockResolvedValue(undefined);
      deliveryRepo.create.mockResolvedValue({} as any);
      productRepo.decrementStock.mockResolvedValue(undefined);

      const result = await useCaseWithDefaults.execute(makeDto());

      expect(result.isSuccess).toBe(true);
      // Default: 300000 base + 200000 delivery
      expect(result.value.totalInCents).toBe(15000000 + 300000 + 200000);
    });
  });
});
