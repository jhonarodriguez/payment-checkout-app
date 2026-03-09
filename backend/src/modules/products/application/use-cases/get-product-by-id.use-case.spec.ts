import { GetProductByIdUseCase } from './get-product-by-id.use-case';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product';
import { NotFoundError, ValidationError } from '../../../../shared/errors/domain-errors';

const makeProduct = (id = 'uuid-1') =>
  new Product(id, 'Producto', 'Desc', 5000, 'img.jpg', 2, new Date());

describe('GetProductByIdUseCase', () => {
  let useCase: GetProductByIdUseCase;
  let mockRepo: jest.Mocked<ProductRepositoryPort>;

  beforeEach(() => {
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };
    useCase = new GetProductByIdUseCase(mockRepo as any);
  });

  it('returns ok result with product when found', async () => {
    const product = makeProduct();
    mockRepo.findById.mockResolvedValue(product);

    const result = await useCase.execute('uuid-1');

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(product);
    expect(mockRepo.findById).toHaveBeenCalledWith('uuid-1');
  });

  it('returns fail with NotFoundError when product does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const result = await useCase.execute('nonexistent-id');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(NotFoundError);
    expect(result.error.message).toContain('nonexistent-id');
  });

  it('returns fail with ValidationError when productId is empty string', async () => {
    const result = await useCase.execute('');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(ValidationError);
    expect(mockRepo.findById).not.toHaveBeenCalled();
  });

  it('returns fail when repository throws an Error', async () => {
    const error = new Error('DB error');
    mockRepo.findById.mockRejectedValue(error);

    const result = await useCase.execute('uuid-1');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });

  it('wraps non-Error thrown values in a generic Error', async () => {
    mockRepo.findById.mockRejectedValue(42);

    const result = await useCase.execute('uuid-1');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Error desconocido');
  });
});
