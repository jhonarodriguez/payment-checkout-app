import { DataSource, Repository } from 'typeorm';
import { seedProducts } from './product.seed';
import { ProductEntity } from '../../modules/products/infrastructure/adapters/product.entity';

describe('seedProducts', () => {
  let mockDataSource: jest.Mocked<DataSource>;
  let mockProductRepo: jest.Mocked<Repository<ProductEntity>>;

  beforeEach(() => {
    mockProductRepo = {
      count: jest.fn(),
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn(),
    } as any;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockProductRepo),
    } as any;

    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips seeding when products already exist in the database', async () => {
    mockProductRepo.count.mockResolvedValue(3);

    await seedProducts(mockDataSource);

    expect(mockProductRepo.save).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(
      'Productos ya existen en la BD. Omitiendo seed.',
    );
  });

  it('inserts all products when database is empty', async () => {
    mockProductRepo.count.mockResolvedValue(0);
    mockProductRepo.save.mockResolvedValue({} as any);

    await seedProducts(mockDataSource);

    expect(mockProductRepo.save).toHaveBeenCalledTimes(3);
    expect(console.log).toHaveBeenCalledWith('Insertando productos de prueba...');
    expect(console.log).toHaveBeenCalledWith('Seed completado.');
  });

  it('seeds the correct product names', async () => {
    const savedProducts: string[] = [];
    mockProductRepo.count.mockResolvedValue(0);
    mockProductRepo.create.mockImplementation((data: any) => data);
    mockProductRepo.save.mockImplementation(async (data: any) => {
      savedProducts.push(data.name);
      return data;
    });

    await seedProducts(mockDataSource);

    expect(savedProducts).toContain('Audífonos Bluetooth Pro');
    expect(savedProducts).toContain('Teclado Mecánico RGB');
    expect(savedProducts).toContain('Mouse Inalámbrico Ergonómico');
  });

  it('uses getRepository with ProductEntity', async () => {
    mockProductRepo.count.mockResolvedValue(1);

    await seedProducts(mockDataSource);

    expect(mockDataSource.getRepository).toHaveBeenCalledWith(ProductEntity);
  });
});
