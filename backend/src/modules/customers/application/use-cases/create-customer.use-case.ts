import { Injectable, Inject } from '@nestjs/common';
import { CustomerRepositoryPort } from '../../domain/ports/customer.repository.port';
import { CreateCustomerDto } from '../../infrastructure/dto/create-customer.dto';
import { Result } from '../../../../shared/result';

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject('CUSTOMER_REPOSITORY')
    private readonly customerRepo: CustomerRepositoryPort,
  ) {}

  async execute(dto: CreateCustomerDto): Promise<Result<any>> {
    try {
      const existing = await this.customerRepo.findByEmail(dto.email);
      if (existing) {
        return Result.ok(existing);
      }

      const newCustomer = await this.customerRepo.create(dto);
      return Result.ok(newCustomer);
    } catch (error) {
      return Result.fail(
        error instanceof Error ? error : new Error('Error al crear el cliente'),
      );
    }
  }
}
