import {
  Controller,
  Get,
  Param,
  Res,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryEntity } from './adapters/delivery.entity';

@ApiTags('deliveries')
@Controller('deliveries')
export class DeliveryController {
  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly repo: Repository<DeliveryEntity>,
  ) {}

  @Get('transaction/:transactionId')
  @ApiOperation({ summary: 'Obtener entrega por transacción' })
  async findByTransaction(
    @Param('transactionId', ParseUUIDPipe) transactionId: string,
    @Res() res: Response,
  ) {
    const delivery = await this.repo.findOne({ where: { transactionId } });

    if (!delivery) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Entrega no encontrada para esta transacción',
      });
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      data: delivery,
    });
  }
}
