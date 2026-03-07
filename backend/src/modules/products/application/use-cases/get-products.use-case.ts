import { Inject, Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { Result } from 'src/shared/result';
import { Product } from '../../domain/entities/product';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(): Promise<Result<Product[]>> {
    try {
      const products = await this.productRepository.findAll();
      return Result.ok(products);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Error desconocido'),
      );
    }
  }
}
