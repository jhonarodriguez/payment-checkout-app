import { Product } from './product';

const makeProduct = (stockUnits = 5, priceInCents = 15000000) =>
  new Product(
    '550e8400-e29b-41d4-a716-446655440000',
    'Audífonos Bluetooth Pro',
    'Descripción del producto',
    priceInCents,
    'https://example.com/image.jpg',
    stockUnits,
    new Date('2024-01-01T00:00:00.000Z'),
  );

describe('Product', () => {
  describe('hasStock', () => {
    it('returns true when stockUnits > 0', () => {
      expect(makeProduct(5).hasStock()).toBe(true);
    });

    it('returns true when stockUnits is 1', () => {
      expect(makeProduct(1).hasStock()).toBe(true);
    });

    it('returns false when stockUnits is 0', () => {
      expect(makeProduct(0).hasStock()).toBe(false);
    });
  });

  describe('formattedPrice', () => {
    it('formats price in COP currency', () => {
      const product = makeProduct(5, 15000000);
      const formatted = product.formattedPrice();
      expect(formatted).toContain('150.000');
      expect(formatted).toContain('COP');
    });

    it('formats zero price', () => {
      const product = makeProduct(5, 0);
      const formatted = product.formattedPrice();
      expect(formatted).toContain('0');
    });
  });

  describe('constructor properties', () => {
    it('exposes all properties correctly', () => {
      const now = new Date();
      const product = new Product(
        'id-1',
        'Nombre',
        'Descripción',
        5000,
        'https://img.url',
        3,
        now,
      );
      expect(product.id).toBe('id-1');
      expect(product.name).toBe('Nombre');
      expect(product.description).toBe('Descripción');
      expect(product.priceInCents).toBe(5000);
      expect(product.imageUrl).toBe('https://img.url');
      expect(product.stockUnits).toBe(3);
      expect(product.createdAt).toBe(now);
    });
  });
});
