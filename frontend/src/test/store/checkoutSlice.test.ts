import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import checkoutReducer, {
  setStep,
  selectProduct,
  setCardData,
  setCardToken,
  setDeliveryData,
  setAcceptanceToken,
  goToSummary,
  startProcessing,
  paymentSuccess,
  paymentFailed,
  resetCheckout,
} from '../../store/slices/checkoutSlice';
import type { CardData, DeliveryData, TransactionResult } from '../../types';

const BLANK: Parameters<typeof checkoutReducer>[0] = {
  currentStep: 1,
  selectedProductId: null,
  cardData: null,
  deliveryData: null,
  cardToken: null,
  acceptanceToken: null,
  transactionId: null,
  transactionResult: null,
  isProcessing: false,
  error: null,
};

const CARD: CardData = {
  number: '4111111111111111',
  holder: 'TEST USER',
  expiryMonth: '12',
  expiryYear: '30',
  cvv: '123',
  lastFour: '1111',
  brand: 'visa',
};

const DELIVERY: DeliveryData = {
  fullName: 'Test User',
  email: 'test@test.com',
  address: 'Calle 1 # 2-3',
  city: 'Bogotá',
  department: 'Cundinamarca',
};

describe('checkoutSlice — reducers', () => {
  beforeEach(() => localStorage.clear());

  it('has correct default initial state', () => {
    const state = checkoutReducer(BLANK, { type: '@@INIT' });
    expect(state.currentStep).toBe(1);
    expect(state.selectedProductId).toBeNull();
    expect(state.isProcessing).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setStep changes currentStep', () => {
    expect(checkoutReducer(BLANK, setStep(3)).currentStep).toBe(3);
    expect(checkoutReducer(BLANK, setStep(4)).currentStep).toBe(4);
  });

  it('selectProduct stores product id and advances to step 2', () => {
    const state = checkoutReducer(BLANK, selectProduct('prod-1'));
    expect(state.selectedProductId).toBe('prod-1');
    expect(state.currentStep).toBe(2);
  });

  it('setCardData stores card data', () => {
    const state = checkoutReducer(BLANK, setCardData(CARD));
    expect(state.cardData).toEqual(CARD);
  });

  it('setCardToken stores token string', () => {
    expect(checkoutReducer(BLANK, setCardToken('tok_xyz')).cardToken).toBe('tok_xyz');
  });

  it('setDeliveryData stores delivery data', () => {
    const state = checkoutReducer(BLANK, setDeliveryData(DELIVERY));
    expect(state.deliveryData).toEqual(DELIVERY);
  });

  it('setAcceptanceToken stores acceptance token', () => {
    expect(checkoutReducer(BLANK, setAcceptanceToken('acc_token')).acceptanceToken).toBe('acc_token');
  });

  it('goToSummary sets step to 3', () => {
    const state = checkoutReducer({ ...BLANK, currentStep: 2 }, goToSummary());
    expect(state.currentStep).toBe(3);
  });

  it('startProcessing sets isProcessing true and clears error', () => {
    const state = checkoutReducer({ ...BLANK, error: 'previous error' }, startProcessing());
    expect(state.isProcessing).toBe(true);
    expect(state.error).toBeNull();
  });

  it('paymentSuccess stores result, sets step 4, clears processing', () => {
    const result: TransactionResult = {
      transactionId: 'tx_123',
      reference: 'ref_123',
      status: 'APPROVED',
      totalInCents: 500000,
      product: { id: 'p1', name: 'Product 1' },
    };
    const state = checkoutReducer({ ...BLANK, isProcessing: true }, paymentSuccess(result));
    expect(state.isProcessing).toBe(false);
    expect(state.transactionResult).toEqual(result);
    expect(state.transactionId).toBe('tx_123');
    expect(state.currentStep).toBe(4);
    expect(state.error).toBeNull();
  });

  it('paymentFailed stores error, sets DECLINED result, sets step 4', () => {
    const state = checkoutReducer({ ...BLANK, isProcessing: true }, paymentFailed('Card declined'));
    expect(state.isProcessing).toBe(false);
    expect(state.error).toBe('Card declined');
    expect(state.transactionResult?.status).toBe('DECLINED');
    expect(state.transactionResult?.errorMessage).toBe('Card declined');
    expect(state.transactionResult?.transactionId).toBe('');
    expect(state.currentStep).toBe(4);
  });

  it('resetCheckout resets all fields to initial state', () => {
    const withData = checkoutReducer(
      checkoutReducer(BLANK, selectProduct('prod-1')),
      setCardData(CARD),
    );
    const reset = checkoutReducer(withData, resetCheckout());
    expect(reset.currentStep).toBe(1);
    expect(reset.selectedProductId).toBeNull();
    expect(reset.cardData).toBeNull();
  });

  it('resetCheckout removes localStorage items', () => {
    localStorage.setItem('checkout_progress', 'something');
    localStorage.setItem('checkout_form_draft', 'something');
    checkoutReducer(BLANK, resetCheckout());
    expect(localStorage.getItem('checkout_progress')).toBeNull();
    expect(localStorage.getItem('checkout_form_draft')).toBeNull();
  });
});

describe('checkoutSlice — loadPersistedState hydration', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('hydrates currentStep and selectedProductId from localStorage', async () => {
    localStorage.setItem(
      'checkout_progress',
      JSON.stringify({ currentStep: 2, selectedProductId: 'product-99' }),
    );
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(2);
    expect(state.selectedProductId).toBe('product-99');
  });

  it('converts persisted step 3 back to step 2', async () => {
    localStorage.setItem(
      'checkout_progress',
      JSON.stringify({ currentStep: 3, selectedProductId: 'product-1' }),
    );
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(2);
  });

  it('hydrates deliveryData and transactionResult', async () => {
    const transactionResult: TransactionResult = {
      transactionId: 'tx_1',
      reference: 'ref_1',
      status: 'APPROVED',
      totalInCents: 500000,
      product: { id: 'p1', name: 'P1' },
    };
    localStorage.setItem(
      'checkout_progress',
      JSON.stringify({
        currentStep: 4,
        selectedProductId: 'p1',
        deliveryData: DELIVERY,
        transactionId: 'tx_1',
        transactionResult,
      }),
    );
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(4);
    expect(state.deliveryData).toEqual(DELIVERY);
    expect(state.transactionResult?.status).toBe('APPROVED');
  });

  it('returns default state when localStorage is empty', async () => {
    localStorage.clear();
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(1);
    expect(state.selectedProductId).toBeNull();
  });

  it('ignores persisted state when selectedProductId is missing', async () => {
    localStorage.setItem(
      'checkout_progress',
      JSON.stringify({ currentStep: 2 }),
    );
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(1);
    expect(state.selectedProductId).toBeNull();
  });

  it('ignores persisted state with step > 4', async () => {
    localStorage.setItem(
      'checkout_progress',
      JSON.stringify({ currentStep: 5, selectedProductId: 'p1' }),
    );
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(1);
  });

  it('returns default state when localStorage contains invalid JSON', async () => {
    localStorage.setItem('checkout_progress', 'invalid {{{ json');
    vi.resetModules();
    const mod = await import('../../store/slices/checkoutSlice');
    const state = mod.default(undefined, { type: '@@INIT' });
    expect(state.currentStep).toBe(1);
  });
});
