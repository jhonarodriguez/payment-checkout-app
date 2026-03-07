import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRepositoryPort } from '../../domain/ports/customer.repository.port';
import { CustomerEntity } from './customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';

@Injectable()
export class CustomerTypeOrmRepository implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly ormRepo: Repository<CustomerEntity>,
  ) {}

  async findByEmail(email: string): Promise<CustomerEntity | null> {
    return this.ormRepo.findOne({ where: { email } });
  }

  async create(dto: CreateCustomerDto): Promise<CustomerEntity> {
    const customer = this.ormRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
    });
    return this.ormRepo.save(customer);
  }
}
