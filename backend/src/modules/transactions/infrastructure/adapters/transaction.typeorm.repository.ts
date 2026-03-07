import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionRepositoryPort } from '../../domain/ports/transaction.repository.port';
import { TransactionEntity, TransactionStatus } from './transaction.entity';

@Injectable()
export class TransactionTypeOrmRepository implements TransactionRepositoryPort {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  async create(data: any): Promise<TransactionEntity> {
    const transaction = this.repo.create(data);
    const saved = await this.repo.save(transaction);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async findById(id: string): Promise<TransactionEntity | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    gatewayTransactionId: string | null,
  ): Promise<void> {
    await this.repo.update(id, {
      status,
      gatewayTransactionId,
    });
  }
}
