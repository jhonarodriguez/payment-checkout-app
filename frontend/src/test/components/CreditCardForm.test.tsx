import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { CreditCardForm } from '../../components/CreditCardForm/CreditCardForm';

// Mock SVG asset imports so vite does not try to process binary files in jsdom
vi.mock('../../assets/visa.svg', () => ({ default: 'visa.svg' }));
vi.mock('../../assets/mastercard.svg', () => ({ default: 'mastercard.svg' }));

const CHECKOUT_STATE_STEP2 = {
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

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
    target: { value: '4111 1111 1111 1111' },
  });
  fireEvent.change(screen.getByLabelText('Nombre en la tarjeta'), {
    target: { value: 'JOHN DOE' },
  });
  fireEvent.change(screen.getByLabelText('Vencimiento'), {
    target: { value: '12/99' },
  });
  fireEvent.change(screen.getByLabelText('CVV'), {
    target: { value: '123' },
  });
  fireEvent.change(screen.getByLabelText('Nombre completo'), {
    target: { value: 'John Doe' },
  });
  fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
    target: { value: 'john@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Dirección de entrega'), {
    target: { value: 'Calle 1 # 2-3' },
  });
  fireEvent.change(screen.getByLabelText('Ciudad'), {
    target: { value: 'Bogotá' },
  });
  fireEvent.change(screen.getByLabelText('Departamento'), {
    target: { value: 'Cundinamarca' },
  });
}

describe('CreditCardForm', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('renders all required form fields and the submit button', () => {
    renderWithProviders(<CreditCardForm />);

    expect(screen.getByLabelText('Número de tarjeta')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre en la tarjeta')).toBeInTheDocument();
    expect(screen.getByLabelText('Vencimiento')).toBeInTheDocument();
    expect(screen.getByLabelText('CVV')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Teléfono/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Dirección de entrega')).toBeInTheDocument();
    expect(screen.getByLabelText('Ciudad')).toBeInTheDocument();
    expect(screen.getByLabelText('Departamento')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ver resumen/i })).toBeInTheDocument();
  });

  it('renders both brand logo images', () => {
    renderWithProviders(<CreditCardForm />);
    expect(screen.getByAltText('VISA')).toBeInTheDocument();
    expect(screen.getByAltText('Mastercard')).toBeInTheDocument();
  });

  it('shows required-field error messages when submitted empty', async () => {
    renderWithProviders(<CreditCardForm />);
    fireEvent.click(screen.getByRole('button', { name: /Ver resumen/i }));

    await waitFor(() => {
      expect(screen.getByText('El número de tarjeta es obligatorio')).toBeInTheDocument();
      expect(screen.getByText('El nombre del titular es obligatorio')).toBeInTheDocument();
    });
  });

  it('shows alert and does NOT advance step when Luhn check fails', async () => {
    const { store } = renderWithProviders(<CreditCardForm />, {
      preloadedState: { checkout: CHECKOUT_STATE_STEP2 },
    });

    // 4111 1111 1111 1112 — last digit changed, fails Luhn
    fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
      target: { value: '4111 1111 1111 1112' },
    });
    fireEvent.change(screen.getByLabelText('Nombre en la tarjeta'), {
      target: { value: 'JOHN DOE' },
    });
    fireEvent.change(screen.getByLabelText('Vencimiento'), { target: { value: '12/99' } });
    fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Dirección de entrega'), {
      target: { value: 'Calle 1 # 2-3' },
    });
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Cundinamarca' } });

    fireEvent.click(screen.getByRole('button', { name: /Ver resumen/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'El número de tarjeta no es válido. Verifica los dígitos.',
      );
    });
    expect(store.getState().checkout.currentStep).toBe(2);
  });

  it('shows alert when card expiry is invalid', async () => {
    renderWithProviders(<CreditCardForm />, {
      preloadedState: { checkout: CHECKOUT_STATE_STEP2 },
    });

    fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
      target: { value: '4111 1111 1111 1111' },
    });
    fireEvent.change(screen.getByLabelText('Nombre en la tarjeta'), { target: { value: 'JOHN DOE' } });
    fireEvent.change(screen.getByLabelText('Vencimiento'), { target: { value: '01/24' } }); // expired
    fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Dirección de entrega'), {
      target: { value: 'Calle 1 # 2-3' },
    });
    fireEvent.change(screen.getByLabelText('Ciudad'), { target: { value: 'Bogotá' } });
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Cundinamarca' } });

    fireEvent.click(screen.getByRole('button', { name: /Ver resumen/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'La tarjeta está vencida o la fecha es inválida.',
      );
    });
  });

  it('dispatches setCardData, setDeliveryData and goToSummary on valid submit', async () => {
    const { store } = renderWithProviders(<CreditCardForm />, {
      preloadedState: { checkout: CHECKOUT_STATE_STEP2 },
    });

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Ver resumen/i }));

    await waitFor(() => {
      expect(store.getState().checkout.currentStep).toBe(3);
    });
    expect(store.getState().checkout.cardData).not.toBeNull();
    expect(store.getState().checkout.cardData?.lastFour).toBe('1111');
    expect(store.getState().checkout.cardData?.brand).toBe('visa');
    expect(store.getState().checkout.deliveryData?.email).toBe('john@example.com');
  });

  it('pre-populates fields from deliveryData already in the store', () => {
    renderWithProviders(<CreditCardForm />, {
      preloadedState: {
        checkout: {
          ...CHECKOUT_STATE_STEP2,
          deliveryData: {
            fullName: 'Stored User',
            email: 'stored@test.com',
            address: 'Stored Address 1',
            city: 'Stored City',
            department: 'Stored Dept',
          },
        },
      },
    });

    expect(screen.getByDisplayValue('Stored User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('stored@test.com')).toBeInTheDocument();
  });

  it('loads form draft from localStorage when no deliveryData in store', () => {
    localStorage.setItem(
      'checkout_form_draft',
      JSON.stringify({
        fullName: 'Draft User',
        email: 'draft@test.com',
        address: 'Draft Address',
        city: 'Draft City',
        department: 'Draft Dept',
      }),
    );

    renderWithProviders(<CreditCardForm />);

    expect(screen.getByDisplayValue('Draft User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('draft@test.com')).toBeInTheDocument();
  });

  it('activates the mastercard logo when a Mastercard number is entered', async () => {
    renderWithProviders(<CreditCardForm />);

    fireEvent.change(screen.getByLabelText('Número de tarjeta'), {
      target: { value: '5500 0055 5555 5559' },
    });

    await waitFor(() => {
      expect(screen.getByTestId('mastercard-logo')).toBeInTheDocument();
    });
  });

  it('shows phone pattern error when an invalid phone is entered and form is submitted', async () => {
    renderWithProviders(<CreditCardForm />, {
      preloadedState: { checkout: CHECKOUT_STATE_STEP2 },
    });

    fillValidForm();
    // Override the phone with a value that fails the pattern /^[0-9]{7,10}$/
    fireEvent.change(screen.getByLabelText(/Teléfono/i), { target: { value: 'abc' } });
    fireEvent.blur(screen.getByLabelText(/Teléfono/i));
    fireEvent.click(screen.getByRole('button', { name: /Ver resumen/i }));

    await waitFor(() => {
      expect(screen.getByText('Entre 7 y 10 dígitos')).toBeInTheDocument();
    });
  });

  it('removes localStorage draft after a successful submit', async () => {
    localStorage.setItem('checkout_form_draft', JSON.stringify({ fullName: 'Old Draft' }));

    renderWithProviders(<CreditCardForm />, {
      preloadedState: { checkout: CHECKOUT_STATE_STEP2 },
    });

    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Ver resumen/i }));

    await waitFor(() => {
      expect(localStorage.getItem('checkout_form_draft')).toBeNull();
    });
  });

  it('recovers gracefully when localStorage draft contains invalid JSON', () => {
    localStorage.setItem('checkout_form_draft', 'not valid json {{{');

    // Should render without throwing and show empty defaults
    expect(() => renderWithProviders(<CreditCardForm />)).not.toThrow();
  });
});
