import { ProductTypeOrmRepository } from './product.typeorm.repository';
import { ProductEntity } from './product.entity';
import { Repository } from 'typeorm';

const makeEntity = (overrides: Partial<ProductEntity> = {}): ProductEntity => ({
  id: 'uuid-1',
  name: 'Producto Test',
  description: 'Descripción',
  priceInCents: 10000,
  imageUrl: 'https://img.url',
  stock: 3,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('ProductTypeOrmRepository', () => {
  let repository: ProductTypeOrmRepository;
  let mockOrmRepo: jest.Mocked<Repository<ProductEntity>>;
  let mockQueryBuilder: any;

  beforeEach(() => {
    mockQueryBuilder = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockOrmRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    } as any;

    repository = new ProductTypeOrmRepository(mockOrmRepo);
  });

  describe('findAll', () => {
    it('returns all products mapped to domain entities', async () => {
      const entities = [makeEntity({ id: '1' }), makeEntity({ id: '2' })];
      mockOrmRepo.find.mockResolvedValue(entities);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(mockOrmRepo.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('returns empty array when no products exist', async () => {
      mockOrmRepo.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('maps entity stock to domain stockUnits', async () => {
      mockOrmRepo.find.mockResolvedValue([makeEntity({ stock: 7 })]);

      const [product] = await repository.findAll();

      expect(product.stockUnits).toBe(7);
    });
  });

  describe('findById', () => {
    it('returns domain product when entity exists', async () => {
      const entity = makeEntity();
      mockOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById('uuid-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('uuid-1');
      expect(result!.name).toBe('Producto Test');
      expect(mockOrmRepo.findOne).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
    });

    it('returns null when entity does not exist', async () => {
      mockOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('decrementStock', () => {
    it('executes atomic query builder update', async () => {
      await repository.decrementStock('uuid-1');

      expect(mockOrmRepo.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(ProductEntity);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id = :id', { id: 'uuid-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('stock > 0');
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
