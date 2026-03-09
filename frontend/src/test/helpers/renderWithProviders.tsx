import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps } from 'react-router-dom';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import productReducer from '../../store/slices/productSlice';
import checkoutReducer from '../../store/slices/checkoutSlice';
import transactionReducer from '../../store/slices/transactionSlice';
import type { RootState } from '../../store';

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>;
  routerProps?: MemoryRouterProps;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    routerProps = {},
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  const store = configureStore({
    reducer: combineReducers({
      products: productReducer,
      checkout: checkoutReducer,
      transaction: transactionReducer,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    preloadedState: preloadedState as any,
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter {...routerProps}>{children}</MemoryRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
