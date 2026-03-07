import { CreateCustomerDto } from '../../infrastructure/dto/create-customer.dto';

export interface CustomerRepositoryPort {
  findByEmail(email: string): Promise<any | null>;
  create(dto: CreateCustomerDto): Promise<any>;
}
