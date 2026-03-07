import { Module } from '@nestjs/common';
import { WompiAdapter } from './infrastructure/adapters/wompi.adapter';
import { GetAcceptanceTokenUseCase } from './application/use-cases/get-acceptance-token.use-case';
import { PaymentsController } from './infrastructure/payments.controller';

@Module({
  providers: [
    {
      provide: 'PAYMENT_GATEWAY',
      useClass: WompiAdapter,
    },
    GetAcceptanceTokenUseCase,
  ],
  controllers: [PaymentsController],
  exports: ['PAYMENT_GATEWAY'],
})
export class PaymentsModule {}
