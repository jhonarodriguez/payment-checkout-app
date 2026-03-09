import { Module } from '@nestjs/common';
import { WompiAdapter } from './infrastructure/adapters/wompi.adapter';
import { GetAcceptanceTokenUseCase } from './application/use-cases/get-acceptance-token.use-case';
import { PaymentsController } from './infrastructure/payments.controller';
import { GetTransactionStatusUseCase } from './application/use-cases/get-transaction-status.use-case';

@Module({
  providers: [
    {
      provide: 'PAYMENT_GATEWAY',
      useClass: WompiAdapter,
    },
    GetAcceptanceTokenUseCase,
    GetTransactionStatusUseCase,
  ],
  controllers: [PaymentsController],
  exports: ['PAYMENT_GATEWAY', GetTransactionStatusUseCase],
})
export class PaymentsModule {}
