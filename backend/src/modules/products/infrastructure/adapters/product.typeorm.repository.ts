import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRepositoryPort } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product';
import { ProductEntity } from './product.entity';

@Injectable()
export class ProductTypeOrmRepository implements ProductRepositoryPort {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly ormRepo: Repository<ProductEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const entities = await this.ormRepo.find({
      order: { createdAt: 'DESC' },
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.ormRepo.findOne({ where: { id } });

    if (!entity) return null;

    return this.toDomain(entity);
  }

  async decrementStock(productId: string): Promise<void> {
    // Usamos una operación atómica para evitar condiciones de carrera
    // (si dos usuarios compran al mismo tiempo, el stock no puede quedar negativo)
    await this.ormRepo
      .createQueryBuilder()
      .update(ProductEntity)
      .set({
        // stock = stock - 1, pero nunca menor a 0
        stock: () => 'GREATEST(stock - 1, 0)',
      })
      .where('id = :id', { id: productId })
      // Solo descuenta si hay stock disponible
      .andWhere('stock > 0')
      .execute();
  }

  private toDomain(entity: ProductEntity): Product {
    return new Product(
      entity.id,
      entity.name,
      entity.description,
      entity.priceInCents,
      entity.imageUrl,
      entity.stock,
      entity.createdAt,
    );
  }
}
