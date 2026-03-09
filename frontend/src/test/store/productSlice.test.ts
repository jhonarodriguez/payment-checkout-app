import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import productReducer, {
  fetchProducts,
  decrementProductStock,
} from '../../store/slices/productSlice';
import type { Product } from '../../types';

vi.mock('../../services/product.service', () => ({
  productService: { getAll: vi.fn() },
}));

import { productService } from '../../services/product.service';

const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Product 1',
    description: 'Desc 1',
    priceInCents: 100000,
    formattedPrice: '$1.000',
    imageUrl: 'https://example.com/p1.jpg',
    stockUnits: 5,
    hasStock: true,
  },
  {
    id: 'p2',
    name: 'Product 2',
    description: 'Desc 2',
    priceInCents: 200000,
    formattedPrice: '$2.000',
    imageUrl: 'https://example.com/p2.jpg',
    stockUnits: 0,
    hasStock: false,
  },
];

const makeStore = () => configureStore({ reducer: { products: productReducer } });

describe('productSlice — decrementProductStock', () => {
  it('decrements stockUnits by 1', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProducts.fulfilled.type, payload: mockProducts });
    store.dispatch(decrementProductStock('p1'));
    const p1 = store.getState().products.items.find((p) => p.id === 'p1');
    expect(p1?.stockUnits).toBe(4);
    expect(p1?.hasStock).toBe(true);
  });

  it('sets hasStock to false when stock reaches 0', () => {
    const store = makeStore();
    const oneLeft = [{ ...mockProducts[0], stockUnits: 1 }];
    store.dispatch({ type: fetchProducts.fulfilled.type, payload: oneLeft });
    store.dispatch(decrementProductStock('p1'));
    const p1 = store.getState().products.items.find((p) => p.id === 'p1');
    expect(p1?.stockUnits).toBe(0);
    expect(p1?.hasStock).toBe(false);
  });

  it('does not decrement when stockUnits is already 0', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProducts.fulfilled.type, payload: [mockProducts[1]] });
    store.dispatch(decrementProductStock('p2'));
    const p2 = store.getState().products.items.find((p) => p.id === 'p2');
    expect(p2?.stockUnits).toBe(0);
  });

  it('does nothing for an unknown product id', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProducts.fulfilled.type, payload: mockProducts });
    store.dispatch(decrementProductStock('unknown'));
    expect(store.getState().products.items[0].stockUnits).toBe(5);
  });
});

describe('productSlice — fetchProducts thunk (extraReducers)', () => {
  it('sets loading true and clears error on pending', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProducts.pending.type });
    const state = store.getState().products;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  it('stores items and stops loading on fulfilled', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProducts.fulfilled.type, payload: mockProducts });
    const state = store.getState().products;
    expect(state.loading).toBe(false);
    expect(state.items).toEqual(mockProducts);
  });

  it('stores error message and stops loading on rejected', () => {
    const store = makeStore();
    store.dispatch({ type: fetchProducts.rejected.type, payload: 'Network error' });
    const state = store.getState().products;
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });
});

describe('productSlice — fetchProducts async thunk (real dispatch)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fulfils with products when service succeeds', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(mockProducts);
    const store = makeStore();
    await store.dispatch(fetchProducts());
    const state = store.getState().products;
    expect(state.items).toEqual(mockProducts);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('rejects with error message when service throws an Error', async () => {
    vi.mocked(productService.getAll).mockRejectedValueOnce(new Error('Network error'));
    const store = makeStore();
    await store.dispatch(fetchProducts());
    expect(store.getState().products.error).toBe('Network error');
  });

  it('rejects with default message when service throws a non-Error', async () => {
    vi.mocked(productService.getAll).mockRejectedValueOnce('oops');
    const store = makeStore();
    await store.dispatch(fetchProducts());
    expect(store.getState().products.error).toBe('Error al cargar los productos');
  });
});
