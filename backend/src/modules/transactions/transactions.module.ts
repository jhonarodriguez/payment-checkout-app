import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './infrastructure/adapters/transaction.entity';
import { TransactionTypeOrmRepository } from './infrastructure/adapters/transaction.typeorm.repository';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { TransactionController } from './infrastructure/transaction.controller';
import { ProductsModule } from '../products/products.module';
import { DeliveriesModule } from '../deliveries/deliveries.module';
import { PaymentsModule } from '../payments/payments.module';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TransactionEntity]),
    ProductsModule,
    CustomersModule,
    DeliveriesModule,
    PaymentsModule,
  ],
  providers: [
    {
      provide: 'TRANSACTION_REPOSITORY',
      useClass: TransactionTypeOrmRepository,
    },
    ProcessPaymentUseCase,
  ],
  controllers: [TransactionController],
})
export class TransactionsModule {}
