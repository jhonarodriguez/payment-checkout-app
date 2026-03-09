import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { ProductPage } from '../../pages/ProductPage/ProductPage';
import type { Product } from '../../types';

vi.mock('../../services/product.service', () => ({
  productService: { getAll: vi.fn() },
}));

import { productService } from '../../services/product.service';

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Awesome Widget',
    description: 'A fantastic widget',
    priceInCents: 250000,
    formattedPrice: '$2.500',
    imageUrl: 'https://example.com/p1.jpg',
    stockUnits: 3,
    hasStock: true,
  },
  {
    id: 'p2',
    name: 'Out of Stock Item',
    description: 'Sold out',
    priceInCents: 100000,
    formattedPrice: '$1.000',
    imageUrl: 'https://example.com/p2.jpg',
    stockUnits: 0,
    hasStock: false,
  },
];

describe('ProductPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a loading spinner while products are fetching', () => {
    // Never resolves so loading stays true
    vi.mocked(productService.getAll).mockReturnValue(new Promise(() => {}));

    renderWithProviders(<ProductPage />);

    expect(screen.getByText(/Cargando productos/i)).toBeInTheDocument();
  });

  it('shows an error message when the service rejects', async () => {
    vi.mocked(productService.getAll).mockRejectedValueOnce(new Error('Server down'));

    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText('Server down')).toBeInTheDocument();
    });
  });

  it('shows a retry button on error that re-dispatches fetchProducts', async () => {
    vi.mocked(productService.getAll)
      .mockRejectedValueOnce(new Error('Server down'))
      .mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => screen.getByRole('button', { name: /Reintentar/i }));

    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(screen.getByText('Awesome Widget')).toBeInTheDocument();
    });
  });

  it('shows "no products" message when the list is empty', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce([]);

    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText(/No hay productos disponibles/i)).toBeInTheDocument();
    });
  });

  it('renders each product card with name, description and price', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText('Awesome Widget')).toBeInTheDocument();
      expect(screen.getByText('A fantastic widget')).toBeInTheDocument();
      expect(screen.getByText('$2.500')).toBeInTheDocument();
    });
  });

  it('shows stock badge with count for in-stock products', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText(/3 en stock/i)).toBeInTheDocument();
    });
  });

  it('shows "Agotado" badge for out-of-stock products', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText('Agotado')).toBeInTheDocument();
    });
  });

  it('disables the buy button for out-of-stock products', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => screen.getByText('Out of Stock Item'));

    const buttons = screen.getAllByRole('button');
    const outOfStockButton = buttons.find((btn) => btn.textContent === 'Sin stock');
    expect(outOfStockButton).toBeDisabled();
  });

  it('dispatches selectProduct when the buy button is clicked', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    const { store } = renderWithProviders(<ProductPage />);

    await waitFor(() => screen.getByText('Awesome Widget'));

    fireEvent.click(screen.getByRole('button', { name: /Comprar Awesome Widget/i }));

    expect(store.getState().checkout.selectedProductId).toBe('p1');
    expect(store.getState().checkout.currentStep).toBe(2);
  });

  it('renders the store header with brand name', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => {
      expect(screen.getByText('Mi Tienda')).toBeInTheDocument();
    });
  });

  it('replaces broken image src with placeholder via onError', async () => {
    vi.mocked(productService.getAll).mockResolvedValueOnce(PRODUCTS);

    renderWithProviders(<ProductPage />);

    await waitFor(() => screen.getByAltText('Awesome Widget'));

    const img = screen.getByAltText('Awesome Widget') as HTMLImageElement;
    fireEvent.error(img);

    expect(img.src).toContain('shutterstock');
  });
});
