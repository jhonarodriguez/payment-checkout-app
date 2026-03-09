import { TransactionTypeOrmRepository } from './transaction.typeorm.repository';
import { TransactionEntity, TransactionStatus } from './transaction.entity';
import { Repository } from 'typeorm';

const makeTransactionEntity = (): TransactionEntity => ({
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
  status: TransactionStatus.PENDING,
  gatewayTransactionId: null,
  cardLastFour: '4242',
  deliveryAddress: 'Calle 123',
  deliveryCity: 'Bogotá',
  deliveryDepartment: 'Cundinamarca',
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('TransactionTypeOrmRepository', () => {
  let repository: TransactionTypeOrmRepository;
  let mockRepo: jest.Mocked<Repository<TransactionEntity>>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    } as any;

    repository = new TransactionTypeOrmRepository(mockRepo);
  });

  describe('create', () => {
    it('creates and saves a transaction entity', async () => {
      const data = {
        reference: 'TXN-001',
        customerId: 'cust-1',
        productId: 'prod-1',
        productAmountInCents: 15000000,
        baseFeeInCents: 300000,
        deliveryFeeInCents: 200000,
        totalInCents: 15500000,
        status: TransactionStatus.PENDING,
        cardLastFour: '4242',
      };
      const entity = makeTransactionEntity();
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await repository.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });

    it('returns first element when save returns an array', async () => {
      const entity = makeTransactionEntity();
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue([entity] as any);

      const result = await repository.create({});

      expect(result).toBe(entity);
    });
  });

  describe('findById', () => {
    it('returns transaction with relations when found', async () => {
      const entity = makeTransactionEntity();
      mockRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById('txn-uuid-1');

      expect(result).toBe(entity);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'txn-uuid-1' },
        relations: ['customer', 'product'],
      });
    });

    it('returns null when transaction not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('updates status and gatewayTransactionId', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 } as any);

      await repository.updateStatus(
        'txn-uuid-1',
        TransactionStatus.APPROVED,
        'gw-123',
      );

      expect(mockRepo.update).toHaveBeenCalledWith('txn-uuid-1', {
        status: TransactionStatus.APPROVED,
        gatewayTransactionId: 'gw-123',
      });
    });

    it('updates status with null gatewayTransactionId', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 } as any);

      await repository.updateStatus('txn-uuid-1', TransactionStatus.ERROR, null);

      expect(mockRepo.update).toHaveBeenCalledWith('txn-uuid-1', {
        status: TransactionStatus.ERROR,
        gatewayTransactionId: null,
      });
    });
  });
});
