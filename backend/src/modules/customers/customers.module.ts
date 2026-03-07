import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerEntity } from './infrastructure/adapters/customer.entity';
import { CustomerTypeOrmRepository } from './infrastructure/adapters/customer.typeorm.repository';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity])],
  providers: [
    {
      provide: 'CUSTOMER_REPOSITORY',
      useClass: CustomerTypeOrmRepository,
    },
    CreateCustomerUseCase,
  ],
})
export class CustomersModule {}
