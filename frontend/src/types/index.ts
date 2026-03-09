
export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  formattedPrice: string;
  imageUrl: string;
  stockUnits: number;
  hasStock: boolean;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export interface CardData {
  number: string;
  holder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  lastFour: string;
  brand: CardBrand;
}

export interface DeliveryData {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  department: string;
}

export type TransactionStatus = 'APPROVED' | 'DECLINED' | 'ERROR' | 'PENDING';

export interface TransactionResult {
  transactionId: string;
  reference: string;
  status: TransactionStatus;
  totalInCents: number;
  product: {
    id: string;
    name: string;
  };
  delivery?: {
    address: string;
    city: string;
  };
  errorMessage?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}