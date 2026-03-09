import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransactionStatus } from '../../types';

interface TransactionState {
  id: string | null;
  reference: string | null;
  status: TransactionStatus | null;
  totalInCents: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: TransactionState = {
  id: null,
  reference: null,
  status: null,
  totalInCents: null,
  loading: false,
  error: null,
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setTransaction: (
      state,
      action: PayloadAction<{
        id: string;
        reference: string;
        status: TransactionStatus;
        totalInCents: number;
      }>,
    ) => {
      state.id = action.payload.id;
      state.reference = action.payload.reference;
      state.status = action.payload.status;
      state.totalInCents = action.payload.totalInCents;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    resetTransaction: () => ({ ...initialState }),
  },
});

export const { setTransaction, setLoading, setError, resetTransaction } =
  transactionSlice.actions;
export default transactionSlice.reducer;