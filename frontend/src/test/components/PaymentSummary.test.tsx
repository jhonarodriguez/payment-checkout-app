import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { PaymentSummary } from '../../components/PaymentSummary/PaymentSummary';
import type { Product } from '../../types';

vi.mock('../../services/payment.service', () => ({
  paymentService: {
    tokenizeCard: vi.fn(),
    getAcceptanceToken: vi.fn(),
    processPayment: vi.fn(),
    pollTransactionStatus: vi.fn(),
  },
}));

import { paymentService } from '../../services/payment.service';

const PRODUCT: Product = {
  id: 'p1',
  name: 'Test Product',
  description: 'A great product',
  priceInCents: 1000000,
  formattedPrice: '$10.000',
  imageUrl: 'https://example.com/img.jpg',
  stockUnits: 5,
  hasStock: true,
};

const BASE_STATE = {
  products: { items: [PRODUCT], loading: false, error: null },
  checkout: {
    currentStep: 3 as const,
    selectedProductId: 'p1',
    cardData: {
      number: '4111111111111111',
      holder: 'TEST USER',
      expiryMonth: '12',
      expiryYear: '30',
      cvv: '123',
      lastFour: '1111',
      brand: 'visa' as const,
    },
    deliveryData: {
      fullName: 'Test User',
      email: 'test@test.com',
      address: 'Calle 1 # 2-3',
      city: 'Bogotá',
      department: 'Cundinamarca',
    },
    cardToken: null,
    acceptanceToken: null,
    transactionId: null,
    transactionResult: null,
    isProcessing: false,
    error: null,
  },
  transaction: {
    id: null,
    reference: null,
    status: null,
    totalInCents: null,
    loading: false,
    error: null,
  },
};

describe('PaymentSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders null when the selected product is not found', () => {
    const { container } = renderWithProviders(<PaymentSummary />, {
      preloadedState: {
        ...BASE_STATE,
        products: { items: [], loading: false, error: null },
      },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders null when cardData is missing', () => {
    const { container } = renderWithProviders(<PaymentSummary />, {
      preloadedState: {
        ...BASE_STATE,
        checkout: { ...BASE_STATE.checkout, cardData: null },
      },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders null when deliveryData is missing', () => {
    const { container } = renderWithProviders(<PaymentSummary />, {
      preloadedState: {
        ...BASE_STATE,
        checkout: { ...BASE_STATE.checkout, deliveryData: null },
      },
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders product name, card info and delivery address', () => {
    renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/VISA/)).toBeInTheDocument();
    expect(screen.getByText(/1111/)).toBeInTheDocument();
    expect(screen.getByText(/Calle 1 # 2-3/)).toBeInTheDocument();
  });

  it('dispatches setStep(2) when the back button is clicked', () => {
    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Volver y editar/i }));

    expect(store.getState().checkout.currentStep).toBe(2);
  });

  it('disables both buttons while processing', async () => {
    vi.mocked(paymentService.tokenizeCard).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Procesando pago/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Volver y editar/i })).toBeDisabled();
    });
  });

  it('dispatches paymentFailed when tokenizeCard throws', async () => {
    vi.mocked(paymentService.tokenizeCard).mockRejectedValueOnce(
      new Error('Card tokenization failed'),
    );

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
      expect(store.getState().checkout.transactionResult?.status).toBe('DECLINED');
    });
    expect(store.getState().checkout.error).toContain('Card tokenization failed');
  });

  it('dispatches paymentFailed when getAcceptanceToken throws', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockRejectedValueOnce(new Error('Gateway down'));

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.transactionResult?.status).toBe('DECLINED');
  });

  it('dispatches paymentFailed when processPayment throws', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockRejectedValueOnce(new Error('Payment rejected'));

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toContain('Payment rejected');
  });

  it('dispatches paymentSuccess and decrements stock when APPROVED', async () => {
    const txData = {
      transactionId: 'tx_ok',
      reference: 'ref_ok',
      status: 'PENDING',
      totalInCents: 1500000,
      product: { id: 'p1', name: 'Test Product' },
    };

    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockResolvedValueOnce(txData);
    vi.mocked(paymentService.pollTransactionStatus).mockResolvedValueOnce('APPROVED');

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
      expect(store.getState().checkout.transactionResult?.status).toBe('APPROVED');
    });
    // Stock should be decremented
    const product = store.getState().products.items.find((p) => p.id === 'p1');
    expect(product?.stockUnits).toBe(4);
  });

  it('dispatches paymentFailed with bank-decline message when DECLINED', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockResolvedValueOnce({
      transactionId: 'tx_d',
      reference: 'ref_d',
      status: 'PENDING',
      totalInCents: 0,
      product: { id: 'p1', name: 'Test Product' },
    });
    vi.mocked(paymentService.pollTransactionStatus).mockResolvedValueOnce('DECLINED');

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toContain('rechazada');
  });

  it('dispatches paymentFailed with fallback message when processPayment throws non-Error', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockRejectedValueOnce({ code: 500 }); // no .message

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toBe('Error al procesar el pago');
  });

  it('dispatches paymentFailed with generic message for non-DECLINED terminal status', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockResolvedValueOnce({
      transactionId: 'tx_e',
      reference: 'ref_e',
      status: 'PENDING',
      totalInCents: 0,
      product: { id: 'p1', name: 'Test Product' },
    });
    vi.mocked(paymentService.pollTransactionStatus).mockResolvedValueOnce('ERROR');

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toContain('no pudo completarse');
  });

  it('dispatches paymentFailed when pollTransactionStatus throws an Error (outer catch)', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockResolvedValueOnce({
      transactionId: 'tx_f',
      reference: 'ref_f',
      status: 'PENDING',
      totalInCents: 0,
      product: { id: 'p1', name: 'Test Product' },
    });
    vi.mocked(paymentService.pollTransactionStatus).mockRejectedValueOnce(
      new Error('Unexpected poll failure'),
    );

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toContain('Unexpected poll failure');
  });

  it('dispatches paymentFailed with default message when outer catch receives a non-Error', async () => {
    vi.mocked(paymentService.tokenizeCard).mockResolvedValueOnce('tok_xyz');
    vi.mocked(paymentService.getAcceptanceToken).mockResolvedValueOnce('acc_abc');
    vi.mocked(paymentService.processPayment).mockResolvedValueOnce({
      transactionId: 'tx_g',
      reference: 'ref_g',
      status: 'PENDING',
      totalInCents: 0,
      product: { id: 'p1', name: 'Test Product' },
    });
    vi.mocked(paymentService.pollTransactionStatus).mockRejectedValueOnce('plain string error');

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toContain('Ocurrió un error al procesar el pago');
  });

  it('renders card info without brand label when brand is "unknown"', () => {
    const stateWithUnknownBrand = {
      ...BASE_STATE,
      checkout: {
        ...BASE_STATE.checkout,
        cardData: { ...BASE_STATE.checkout.cardData!, brand: 'unknown' as const },
      },
    };
    renderWithProviders(<PaymentSummary />, { preloadedState: stateWithUnknownBrand });

    expect(screen.getByText(/\*\*\*\* 1111/)).toBeInTheDocument();
  });

  it('dispatches paymentFailed when tokenizeCard throws a non-Error value', async () => {
    vi.mocked(paymentService.tokenizeCard).mockRejectedValueOnce('raw string error');

    const { store } = renderWithProviders(<PaymentSummary />, { preloadedState: BASE_STATE });

    fireEvent.click(screen.getByRole('button', { name: /Confirmar y Pagar/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(4);
    });
    expect(store.getState().checkout.error).toContain('Error desconocido al procesar la tarjeta');
  });
});
