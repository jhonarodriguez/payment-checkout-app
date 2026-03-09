import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn() },
}));

import api from '../../services/api';
import { productService } from '../../services/product.service';
import type { Product } from '../../types';

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Test Product',
    description: 'A product',
    priceInCents: 100000,
    formattedPrice: '$1.000',
    imageUrl: 'https://example.com/img.jpg',
    stockUnits: 3,
    hasStock: true,
  },
];

describe('productService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getAll', () => {
    it('calls GET /products and returns the data array', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: PRODUCTS } });

      const result = await productService.getAll();

      expect(api.get).toHaveBeenCalledWith('/products');
      expect(result).toEqual(PRODUCTS);
    });

    it('propagates errors thrown by the api instance', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Network error'));

      await expect(productService.getAll()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('calls GET /products/:id and returns the single product', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: { data: PRODUCTS[0] } });

      const result = await productService.getById('p1');

      expect(api.get).toHaveBeenCalledWith('/products/p1');
      expect(result).toEqual(PRODUCTS[0]);
    });

    it('propagates errors thrown by the api instance', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Not found'));

      await expect(productService.getById('unknown')).rejects.toThrow('Not found');
    });
  });
});
