import { CustomerTypeOrmRepository } from './customer.typeorm.repository';
import { CustomerEntity } from './customer.entity';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from '../dto/create-customer.dto';

const makeCustomerEntity = (): CustomerEntity => ({
  id: 'uuid-1',
  fullName: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '3001234567',
  createdAt: new Date(),
});

describe('CustomerTypeOrmRepository', () => {
  let repository: CustomerTypeOrmRepository;
  let mockOrmRepo: jest.Mocked<Repository<CustomerEntity>>;

  beforeEach(() => {
    mockOrmRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    repository = new CustomerTypeOrmRepository(mockOrmRepo);
  });

  describe('findByEmail', () => {
    it('returns customer entity when found', async () => {
      const entity = makeCustomerEntity();
      mockOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByEmail('juan@example.com');

      expect(result).toBe(entity);
      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'juan@example.com' },
      });
    });

    it('returns null when customer not found', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and saves a new customer', async () => {
      const dto: CreateCustomerDto = {
        fullName: 'María García',
        email: 'maria@example.com',
        phone: '3109876543',
      };
      const createdEntity = makeCustomerEntity();
      mockOrmRepo.create.mockReturnValue(createdEntity);
      mockOrmRepo.save.mockResolvedValue(createdEntity);

      const result = await repository.create(dto);

      expect(mockOrmRepo.create).toHaveBeenCalledWith({
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
      });
      expect(mockOrmRepo.save).toHaveBeenCalledWith(createdEntity);
      expect(result).toBe(createdEntity);
    });
  });
});
