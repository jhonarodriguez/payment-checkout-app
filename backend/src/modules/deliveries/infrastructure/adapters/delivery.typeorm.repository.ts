import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRepositoryPort } from '../../domain/ports/delivery.repository.port';
import { DeliveryEntity } from './delivery.entity';

@Injectable()
export class DeliveryTypeOrmRepository implements DeliveryRepositoryPort {
  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly repo: Repository<DeliveryEntity>,
  ) {}

  async create(data: any): Promise<DeliveryEntity> {
    const delivery = this.repo.create(data);
    const saved = await this.repo.save(delivery);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<DeliveryEntity | null> {
    return this.repo.findOne({ where: { transactionId } });
  }
}
