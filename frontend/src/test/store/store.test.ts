import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('store — localStorageMiddleware', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('persists checkout state to localStorage after an action', async () => {
    const { store } = await import('../../store');
    const { selectProduct } = await import('../../store/slices/checkoutSlice');

    store.dispatch(selectProduct('product-123'));

    const saved = localStorage.getItem('checkout_progress');
    expect(saved).not.toBeNull();
    const parsed = JSON.parse(saved!);
    expect(parsed.selectedProductId).toBe('product-123');
    expect(parsed.currentStep).toBe(2);
  });

  it('only persists the expected subset of checkout fields', async () => {
    const { store } = await import('../../store');
    const { selectProduct } = await import('../../store/slices/checkoutSlice');

    store.dispatch(selectProduct('product-456'));

    const parsed = JSON.parse(localStorage.getItem('checkout_progress')!);
    expect(parsed).toHaveProperty('currentStep');
    expect(parsed).toHaveProperty('selectedProductId');
    expect(parsed).toHaveProperty('deliveryData');
    expect(parsed).toHaveProperty('transactionId');
    expect(parsed).toHaveProperty('transactionResult');
    // Sensitive card data must NOT be persisted
    expect(parsed).not.toHaveProperty('cardData');
    expect(parsed).not.toHaveProperty('cardToken');
    expect(parsed).not.toHaveProperty('acceptanceToken');
  });

  it('handles a localStorage write failure without throwing', async () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

    const { store } = await import('../../store');
    const { selectProduct } = await import('../../store/slices/checkoutSlice');

    expect(() => store.dispatch(selectProduct('product-789'))).not.toThrow();

    setItemSpy.mockRestore();
  });

  it('store exposes the correct reducer keys', async () => {
    const { store } = await import('../../store');
    const state = store.getState();
    expect(state).toHaveProperty('products');
    expect(state).toHaveProperty('checkout');
    expect(state).toHaveProperty('transaction');
  });
});
