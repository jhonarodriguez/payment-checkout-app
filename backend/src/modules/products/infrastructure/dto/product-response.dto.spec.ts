import { Product } from '../../domain/entities/product';
import {
  toProductResponseDto,
  ProductResponseDto,
} from './product-response.dto';

const makeProduct = (stockUnits = 5) =>
  new Product(
    'uuid-1',
    'Teclado Mecánico',
    'Descripción del teclado',
    25000000,
    'https://example.com/keyboard.jpg',
    stockUnits,
    new Date('2024-06-01T00:00:00.000Z'),
  );

describe('toProductResponseDto', () => {
  it('maps all product fields correctly', () => {
    const product = makeProduct(3);
    const dto = toProductResponseDto(product);

    expect(dto.id).toBe('uuid-1');
    expect(dto.name).toBe('Teclado Mecánico');
    expect(dto.description).toBe('Descripción del teclado');
    expect(dto.priceInCents).toBe(25000000);
    expect(dto.imageUrl).toBe('https://example.com/keyboard.jpg');
    expect(dto.stockUnits).toBe(3);
  });

  it('includes formattedPrice from product.formattedPrice()', () => {
    const product = makeProduct();
    const dto = toProductResponseDto(product);
    expect(dto.formattedPrice).toBe(product.formattedPrice());
  });

  it('sets hasStock to true when product has stock', () => {
    const dto = toProductResponseDto(makeProduct(1));
    expect(dto.hasStock).toBe(true);
  });

  it('sets hasStock to false when product has no stock', () => {
    const dto = toProductResponseDto(makeProduct(0));
    expect(dto.hasStock).toBe(false);
  });
});
