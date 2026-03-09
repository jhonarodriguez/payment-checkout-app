import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { CheckoutPage } from '../../pages/CheckoutPage/CheckoutPage';

// Prevent cascading render issues from form sub-components
vi.mock('../../components/CreditCardForm/CreditCardForm', () => ({
  CreditCardForm: () => <div data-testid="credit-card-form">CreditCardForm</div>,
}));
vi.mock('../../components/PaymentSummary/PaymentSummary', () => ({
  PaymentSummary: () => <div data-testid="payment-summary">PaymentSummary</div>,
}));

const CHECKOUT_STEP2 = {
  currentStep: 2 as const,
  selectedProductId: 'p1',
  cardData: null,
  deliveryData: null,
  cardToken: null,
  acceptanceToken: null,
  transactionId: null,
  transactionResult: null,
  isProcessing: false,
  error: null,
};

const CHECKOUT_STEP3 = { ...CHECKOUT_STEP2, currentStep: 3 as const };

describe('CheckoutPage', () => {
  it('shows "Datos de pago" title when on step 2', () => {
    renderWithProviders(<CheckoutPage />, {
      preloadedState: { checkout: CHECKOUT_STEP2 },
    });

    expect(screen.getByText('Datos de pago')).toBeInTheDocument();
  });

  it('shows "Confirmar pago" title when on step 3', () => {
    renderWithProviders(<CheckoutPage />, {
      preloadedState: { checkout: CHECKOUT_STEP3 },
    });

    expect(screen.getByText('Confirmar pago')).toBeInTheDocument();
  });

  it('always renders the CreditCardForm', () => {
    renderWithProviders(<CheckoutPage />, {
      preloadedState: { checkout: CHECKOUT_STEP2 },
    });

    expect(screen.getByTestId('credit-card-form')).toBeInTheDocument();
  });

  it('renders PaymentSummary overlay only when on step 3', () => {
    const { rerender, store } = renderWithProviders(<CheckoutPage />, {
      preloadedState: { checkout: CHECKOUT_STEP2 },
    });

    expect(screen.queryByTestId('payment-summary')).not.toBeInTheDocument();

    // Simulate advancing to step 3
    store.dispatch({ type: 'checkout/goToSummary' });
    rerender(<CheckoutPage />);

    expect(screen.getByTestId('payment-summary')).toBeInTheDocument();
  });

  it('back button on step 2 dispatches resetCheckout', () => {
    const { store } = renderWithProviders(<CheckoutPage />, {
      preloadedState: { checkout: CHECKOUT_STEP2 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));

    expect(store.getState().checkout.currentStep).toBe(1);
    expect(store.getState().checkout.selectedProductId).toBeNull();
  });

  it('back button on step 3 dispatches setStep(2)', () => {
    const { store } = renderWithProviders(<CheckoutPage />, {
      preloadedState: { checkout: CHECKOUT_STEP3 },
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver/i }));

    expect(store.getState().checkout.currentStep).toBe(2);
  });
});
