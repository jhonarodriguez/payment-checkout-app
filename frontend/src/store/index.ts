import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import productReducer from './slices/productSlice';
import checkoutReducer from './slices/checkoutSlice';
import transactionReducer from './slices/transactionSlice';

const localStorageMiddleware =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (storeApi: any) => (next: any) => (action: any) => {

    const result = next(action);

    const state = storeApi.getState();

    const toPersist = {
      currentStep: state.checkout.currentStep,
      selectedProductId: state.checkout.selectedProductId,
      deliveryData: state.checkout.deliveryData,
      transactionId: state.checkout.transactionId,
      transactionResult: state.checkout.transactionResult,
    };

    try {
      localStorage.setItem('checkout_progress', JSON.stringify(toPersist));
    } catch {
      // localStorage puede fallar en modo incógnito o si está lleno
      // La app sigue funcionando sin persistencia
    }

    return result;
  };

export const store = configureStore({
  reducer: {
    products: productReducer,
    checkout: checkoutReducer,
    transaction: transactionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;