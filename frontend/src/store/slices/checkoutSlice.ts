import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CardData, DeliveryData, TransactionResult } from '../../types';

interface CheckoutState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  selectedProductId: string | null;
  cardData: CardData | null;
  deliveryData: DeliveryData | null;
  cardToken: string | null;
  acceptanceToken: string | null;
  transactionId: string | null;
  transactionResult: TransactionResult | null;
  isProcessing: boolean;
  error: string | null;
}

const loadPersistedState = (): Partial<CheckoutState> => {
  try {
    const saved = localStorage.getItem('checkout_progress');
    if (!saved) return {};

    const parsed = JSON.parse(saved);
    
    if (
      parsed.currentStep &&
      parsed.currentStep >= 1 &&
      parsed.currentStep <= 4 &&
      parsed.selectedProductId
    ) {
      return {
        currentStep: parsed.currentStep,
        selectedProductId: parsed.selectedProductId,
        transactionId: parsed.transactionId || null,
        transactionResult: parsed.transactionResult || null
      };
    }

    return {};
  } catch {
    return {};
  }
};

const INITIAL_STATE: CheckoutState = {
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

const persistedState = loadPersistedState();
const HYDRATED_STATE: CheckoutState = {
  ...INITIAL_STATE,
  ...persistedState,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: HYDRATED_STATE,

  reducers: {
    
    setStep: (state, action: PayloadAction<CheckoutState['currentStep']>) => {
      state.currentStep = action.payload;
    },
    
    selectProduct: (state, action: PayloadAction<string>) => {
      state.selectedProductId = action.payload;
      state.currentStep = 2;
    },
    
    setCardData: (state, action: PayloadAction<CardData>) => {
      state.cardData = action.payload;
    },
    
    setCardToken: (state, action: PayloadAction<string>) => {
      state.cardToken = action.payload;
    },
    
    setDeliveryData: (state, action: PayloadAction<DeliveryData>) => {
      state.deliveryData = action.payload;
    },
    
    setAcceptanceToken: (state, action: PayloadAction<string>) => {
      state.acceptanceToken = action.payload;
    },
    
    goToSummary: (state) => {
      state.currentStep = 3;
    },
    
    startProcessing: (state) => {
      state.isProcessing = true;
      state.error = null;
    },
    
    paymentSuccess: (state, action: PayloadAction<TransactionResult>) => {
      state.isProcessing = false;
      state.transactionResult = action.payload;
      state.transactionId = action.payload.transactionId;
      state.currentStep = 4;
      state.error = null;
    },
    
    paymentFailed: (state, action: PayloadAction<string>) => {
      state.isProcessing = false;
      state.error = action.payload;
      state.transactionResult = {
        transactionId: '',
        reference: '',
        status: 'DECLINED',
        totalInCents: 0,
        product: { id: '', name: '' },
        errorMessage: action.payload,
      };
      state.currentStep = 4;
    },
    
    resetCheckout: () => {
      localStorage.removeItem('checkout_progress');
      return { ...INITIAL_STATE };
    },
  },
});

export const {
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
} = checkoutSlice.actions;

export default checkoutSlice.reducer;