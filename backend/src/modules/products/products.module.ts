import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from './infrastructure/adapters/product.entity';
import { ProductTypeOrmRepository } from './infrastructure/adapters/product.typeorm.repository';
import { GetProductsUseCase } from './application/use-cases/get-products.use-case';
import { GetProductByIdUseCase } from './application/use-cases/get-product-by-id.use-case';
import { ProductController } from './infrastructure/product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  providers: [
    {
      provide: 'PRODUCT_REPOSITORY',
      useClass: ProductTypeOrmRepository,
    },
    GetProductsUseCase,
    GetProductByIdUseCase,
  ],
  controllers: [ProductController],
  exports: ['PRODUCT_REPOSITORY'],
})
export class ProductsModule {}
