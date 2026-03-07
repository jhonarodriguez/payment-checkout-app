import { Product } from '../entities/product';

export interface ProductRepositoryPort {
  findAll(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  decrementStock(productId: string): Promise<void>;
}
