import { NotFoundError, ValidationError } from './domain-errors';

describe('NotFoundError', () => {
  it('creates error with entity and id', () => {
    const error = new NotFoundError('Producto', 'abc-123');
    expect(error.message).toBe("Producto con id 'abc-123' no encontrado");
    expect(error.name).toBe('NotFoundError');
    expect(error.statusCode).toBe(404);
    expect(error).toBeInstanceOf(Error);
  });

  it('creates error with entity only (no id)', () => {
    const error = new NotFoundError('Producto');
    expect(error.message).toBe('Producto no encontrado');
    expect(error.name).toBe('NotFoundError');
    expect(error.statusCode).toBe(404);
  });

  it('is an instance of Error', () => {
    const error = new NotFoundError('Entidad');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(NotFoundError);
  });
});

describe('ValidationError', () => {
  it('creates error with a message', () => {
    const error = new ValidationError('El campo es requerido');
    expect(error.message).toBe('El campo es requerido');
    expect(error.name).toBe('ValidationError');
    expect(error.statusCode).toBe(400);
  });

  it('is an instance of Error', () => {
    const error = new ValidationError('invalid');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
  });
});
