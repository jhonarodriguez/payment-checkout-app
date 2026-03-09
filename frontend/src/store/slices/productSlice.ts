import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';
import { productService } from '../../services/product.service';

interface ProductState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await productService.getAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar los productos';
      return rejectWithValue(message);
    }
  },
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    decrementProductStock: (state, action: PayloadAction<string>) => {
      const product = state.items.find((p) => p.id === action.payload);
      if (product && product.stockUnits > 0) {
        product.stockUnits -= 1;
        product.hasStock = product.stockUnits > 0;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { decrementProductStock } = productSlice.actions;
export default productSlice.reducer;