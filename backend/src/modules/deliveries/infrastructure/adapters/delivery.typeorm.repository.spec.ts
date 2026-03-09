import { DeliveryTypeOrmRepository } from './delivery.typeorm.repository';
import { DeliveryEntity, DeliveryStatus } from './delivery.entity';
import { Repository } from 'typeorm';

const makeDeliveryEntity = (): DeliveryEntity => ({
  id: 'del-uuid-1',
  transaction: null as any,
  transactionId: 'txn-1',
  customer: null as any,
  customerId: 'cust-1',
  address: 'Calle 123 # 45-67',
  city: 'Bogotá',
  department: 'Cundinamarca',
  status: DeliveryStatus.PENDING,
  createdAt: new Date(),
});

describe('DeliveryTypeOrmRepository', () => {
  let repository: DeliveryTypeOrmRepository;
  let mockRepo: jest.Mocked<Repository<DeliveryEntity>>;

  beforeEach(() => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    } as any;

    repository = new DeliveryTypeOrmRepository(mockRepo);
  });

  describe('create', () => {
    it('creates and saves a delivery entity', async () => {
      const data = {
        transactionId: 'txn-1',
        customerId: 'cust-1',
        address: 'Calle 123',
        city: 'Medellín',
        department: 'Antioquia',
      };
      const entity = makeDeliveryEntity();
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await repository.create(data);

      expect(mockRepo.create).toHaveBeenCalledWith(data);
      expect(mockRepo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });

    it('returns first element when save returns an array', async () => {
      const entity = makeDeliveryEntity();
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue([entity] as any);

      const result = await repository.create({});

      expect(result).toBe(entity);
    });
  });

  describe('findByTransactionId', () => {
    it('returns delivery when found', async () => {
      const entity = makeDeliveryEntity();
      mockRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByTransactionId('txn-1');

      expect(result).toBe(entity);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { transactionId: 'txn-1' },
      });
    });

    it('returns null when delivery not found', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByTransactionId('nonexistent');

      expect(result).toBeNull();
    });
  });
});
