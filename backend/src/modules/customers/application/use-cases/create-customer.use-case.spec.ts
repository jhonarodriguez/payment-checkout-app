import { CreateCustomerUseCase } from './create-customer.use-case';
import { CustomerRepositoryPort } from '../../domain/ports/customer.repository.port';
import { CreateCustomerDto } from '../../infrastructure/dto/create-customer.dto';

const makeDto = (overrides: Partial<CreateCustomerDto> = {}): CreateCustomerDto => ({
  fullName: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '3001234567',
  ...overrides,
});

const makeCustomer = (id = 'cust-1') => ({
  id,
  fullName: 'Juan Pérez',
  email: 'juan@example.com',
  phone: '3001234567',
});

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let mockRepo: jest.Mocked<CustomerRepositoryPort>;

  beforeEach(() => {
    mockRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    useCase = new CreateCustomerUseCase(mockRepo as any);
  });

  it('returns existing customer when email already registered', async () => {
    const existingCustomer = makeCustomer('existing-id');
    mockRepo.findByEmail.mockResolvedValue(existingCustomer);

    const result = await useCase.execute(makeDto());

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(existingCustomer);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('creates and returns new customer when email not registered', async () => {
    const newCustomer = makeCustomer('new-id');
    mockRepo.findByEmail.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue(newCustomer);

    const result = await useCase.execute(makeDto());

    expect(result.isSuccess).toBe(true);
    expect(result.value).toBe(newCustomer);
    expect(mockRepo.create).toHaveBeenCalledWith(makeDto());
  });

  it('returns fail result when repository throws an Error', async () => {
    const error = new Error('DB error');
    mockRepo.findByEmail.mockRejectedValue(error);

    const result = await useCase.execute(makeDto());

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(error);
  });

  it('wraps non-Error thrown values', async () => {
    mockRepo.findByEmail.mockRejectedValue('unexpected');

    const result = await useCase.execute(makeDto());

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Error al crear el cliente');
  });
});
