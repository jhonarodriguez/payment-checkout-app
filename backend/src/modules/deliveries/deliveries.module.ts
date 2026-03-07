import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryEntity } from './infrastructure/adapters/delivery.entity';
import { DeliveryTypeOrmRepository } from './infrastructure/adapters/delivery.typeorm.repository';
import { DeliveryController } from './infrastructure/delivery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeliveryEntity])],
  providers: [
    {
      provide: 'DELIVERY_REPOSITORY',
      useClass: DeliveryTypeOrmRepository,
    },
  ],
  controllers: [DeliveryController],
  exports: ['DELIVERY_REPOSITORY'],
})
export class DeliveriesModule {}
