import api from './api';
import { Product } from '../types';

export const productService = {
    
  async getAll(): Promise<Product[]> {
    const response = await api.get('/products');
    return response.data.data;
  },
  
  async getById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data.data;
  },
};