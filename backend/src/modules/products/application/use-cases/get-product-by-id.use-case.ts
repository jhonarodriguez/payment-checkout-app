import { Inject, Injectable } from '@nestjs/common';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product';
import { Result } from '../../../../shared/result';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/errors/domain-errors';

@Injectable()
export class GetProductByIdUseCase {
  constructor(
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepository: ProductRepositoryPort,
  ) {}

  async execute(productId: string): Promise<Result<Product>> {
    try {
      if (!productId || typeof productId !== 'string') {
        return Result.fail(new ValidationError('ID de producto inválido'));
      }

      const product = await this.productRepository.findById(productId);

      if (!product) {
        return Result.fail(new NotFoundError('Producto', productId));
      }

      return Result.ok(product);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Error desconocido'),
      );
    }
  }
}
