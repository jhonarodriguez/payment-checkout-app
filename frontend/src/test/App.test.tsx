import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import App from '../App';
import { store } from '../store';
import {
  selectProduct,
  resetCheckout,
  setStep,
  paymentSuccess,
} from '../store/slices/checkoutSlice';

// Mock page components to avoid full render trees and API calls
vi.mock('../pages/ProductPage/ProductPage', () => ({
  ProductPage: () => <div data-testid="product-page">ProductPage</div>,
}));
vi.mock('../pages/CheckoutPage/CheckoutPage', () => ({
  CheckoutPage: () => <div data-testid="checkout-page">CheckoutPage</div>,
}));
vi.mock('../pages/ResultPage/ResultPage', () => ({
  ResultPage: () => <div data-testid="result-page">ResultPage</div>,
}));

describe('App — navigation', () => {
  beforeEach(() => {
    // Reset to step 1 and restore URL for each test
    store.dispatch(resetCheckout());
    window.history.pushState({}, '', '/');
  });

  it('renders ProductPage at the default "/" route (step 1)', () => {
    render(<App />);
    expect(screen.getByTestId('product-page')).toBeInTheDocument();
  });

  it('navigates to CheckoutPage when step becomes 2', async () => {
    render(<App />);

    act(() => {
      store.dispatch(selectProduct('product-1'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    });
  });

  it('navigates to CheckoutPage when step becomes 3', async () => {
    render(<App />);

    act(() => {
      store.dispatch(selectProduct('product-1'));
      store.dispatch(setStep(3));
    });

    await waitFor(() => {
      expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    });
  });

  it('navigates to ResultPage when step becomes 4', async () => {
    render(<App />);

    act(() => {
      store.dispatch(
        paymentSuccess({
          transactionId: 'tx_1',
          reference: 'ref_1',
          status: 'APPROVED',
          totalInCents: 500000,
          product: { id: 'p1', name: 'Product 1' },
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('result-page')).toBeInTheDocument();
    });
  });

  it('navigates back to ProductPage when step becomes 5', async () => {
    render(<App />);

    act(() => {
      store.dispatch(setStep(5));
    });

    await waitFor(() => {
      expect(screen.getByTestId('product-page')).toBeInTheDocument();
    });
  });

  it('redirects unknown routes to ProductPage', () => {
    window.history.pushState({}, '', '/nonexistent-path');
    render(<App />);
    expect(screen.getByTestId('product-page')).toBeInTheDocument();
  });
});
