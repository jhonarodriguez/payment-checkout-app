import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ProcessPaymentUseCase } from '../application/use-cases/process-payment.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionEntity } from './adapters/transaction.entity';
import { Repository } from 'typeorm';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly processPayment: ProcessPaymentUseCase,
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear transacción y procesar el pago' })
  async create(@Body() dto: CreateTransactionDto, @Res() res: Response) {
    const result = await this.processPayment.execute(dto);

    if (result.isFailure) {
      return res.status(HttpStatus.PAYMENT_REQUIRED).json({
        success: false,
        message: result.error.message,
      });
    }

    return res.status(HttpStatus.CREATED).json({
      success: true,
      data: result.value,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una transacción por ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const transaction = await this.repo.findOne({
      where: { id },
      relations: ['customer', 'product'],
    });

    if (!transaction) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Transacción no encontrada',
      });
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      data: transaction,
    });
  }
}
