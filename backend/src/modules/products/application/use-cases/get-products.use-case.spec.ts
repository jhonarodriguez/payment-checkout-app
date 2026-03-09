import { GetProductsUseCase } from './get-products.use-case';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product';

const makeProduct = (id: string) =>
  new Product(id, 'Producto', 'Desc', 1000, 'img.jpg', 3, new Date());

describe('GetProductsUseCase', () => {
  let useCase: GetProductsUseCase;
  let mockRepo: jest.Mocked<ProductRepositoryPort>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };
    useCase = new GetProductsUseCase(mockRepo as any);
  });

  it('returns ok result with products when repository succeeds', async () => {
    const products = [makeProduct('1'), makeProduct('2')];
    mockRepo.findAll.mockResolvedValue(products);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual(products);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('returns ok result with empty array when no products', async () => {
    mockRepo.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result.isSuccess).toBe(true);
    expect(result.value).toEqual([]);
  });

  it('returns fail result when repository throws an Error', async () => {
    const error = new Error('DB connection failed');
    mockRepo.findAll.mockRejectedValue(error);

    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });

  it('wraps non-Error thrown values in a generic Error', async () => {
    mockRepo.findAll.mockRejectedValue('string error');

    const result = await useCase.execute();

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Error desconocido');
  });
});
