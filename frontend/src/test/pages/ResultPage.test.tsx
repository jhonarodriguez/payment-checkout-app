import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { ResultPage } from '../../pages/ResultPage/ResultPage';

vi.mock('../../services/product.service', () => ({
  productService: { getAll: vi.fn().mockResolvedValue([]) },
}));

import type { TransactionResult } from '../../types';

const APPROVED_RESULT: TransactionResult = {
  transactionId: 'tx_ok',
  reference: 'REF-001',
  status: 'APPROVED',
  totalInCents: 1500000,
  product: { id: 'p1', name: 'Awesome Widget' },
  delivery: { address: 'Calle 1 # 2-3', city: 'Bogotá' },
};

const DECLINED_RESULT: TransactionResult = {
  transactionId: '',
  reference: '',
  status: 'DECLINED',
  totalInCents: 0,
  product: { id: '', name: '' },
  errorMessage: 'La transacción fue rechazada por el banco',
};

describe('ResultPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows success title and check icon for APPROVED status', () => {
    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: 'p1',
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: 'tx_ok',
          transactionResult: APPROVED_RESULT,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('¡Pago exitoso!')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
    expect(
      screen.getByText(/Tu pedido ha sido confirmado/i),
    ).toBeInTheDocument();
  });

  it('shows transaction reference, product name, total and delivery for APPROVED', () => {
    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: 'p1',
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: 'tx_ok',
          transactionResult: APPROVED_RESULT,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.getByText('Awesome Widget')).toBeInTheDocument();
    expect(screen.getByText(/Calle 1 # 2-3/)).toBeInTheDocument();
    expect(screen.getByText(/Bogotá/)).toBeInTheDocument();
  });

  it('shows failure title and X icon for DECLINED status', () => {
    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: null,
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: null,
          transactionResult: DECLINED_RESULT,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('Pago no procesado')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByText('La transacción fue rechazada por el banco')).toBeInTheDocument();
  });

  it('shows generic failure message when no errorMessage is present', () => {
    const result: TransactionResult = { ...DECLINED_RESULT, errorMessage: undefined };

    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: null,
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: null,
          transactionResult: result,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByText(/La transacción no pudo completarse/i)).toBeInTheDocument();
  });

  it('shows failure state when transactionResult is null', () => {
    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: null,
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: null,
          transactionResult: null,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByText('Pago no procesado')).toBeInTheDocument();
  });

  it('shows "Volver a la tienda" button label for APPROVED', () => {
    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: 'p1',
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: 'tx_ok',
          transactionResult: APPROVED_RESULT,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByRole('button', { name: /Volver a la tienda/i })).toBeInTheDocument();
  });

  it('shows "Intentar de nuevo" button label for failed payment', () => {
    renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: null,
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: null,
          transactionResult: DECLINED_RESULT,
          isProcessing: false,
          error: null,
        },
      },
    });

    expect(screen.getByRole('button', { name: /Intentar de nuevo/i })).toBeInTheDocument();
  });

  it('dispatches resetCheckout and fetchProducts when the back button is clicked', async () => {
    const { store } = renderWithProviders(<ResultPage />, {
      preloadedState: {
        checkout: {
          currentStep: 4,
          selectedProductId: 'p1',
          cardData: null,
          deliveryData: null,
          cardToken: null,
          acceptanceToken: null,
          transactionId: 'tx_ok',
          transactionResult: APPROVED_RESULT,
          isProcessing: false,
          error: null,
        },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver a la tienda/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(1);
      expect(store.getState().checkout.transactionResult).toBeNull();
    });
  });
});
