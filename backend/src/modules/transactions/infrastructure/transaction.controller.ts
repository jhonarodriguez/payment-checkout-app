import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  HttpStatus,
  ParseUUIDPipe,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ProcessPaymentUseCase } from '../application/use-cases/process-payment.use-case';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { InjectRepository } from '@nestjs/typeorm';
import {
  TransactionEntity,
  TransactionStatus,
} from './adapters/transaction.entity';
import { Repository } from 'typeorm';
import { GetTransactionStatusUseCase } from '../../payments/application/use-cases/get-transaction-status.use-case';
import { ProductRepositoryPort } from '../../products/domain/ports/product.repository.port';
import { DeliveryRepositoryPort } from '../../deliveries/domain/ports/delivery.repository.port';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly processPayment: ProcessPaymentUseCase,
    private readonly getTransactionStatus: GetTransactionStatusUseCase,
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepo: ProductRepositoryPort,

    @Inject('DELIVERY_REPOSITORY')
    private readonly deliveryRepo: DeliveryRepositoryPort,
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

  @Get(':id/status')
  @ApiOperation({ summary: 'Consultar estado actual de una transacción' })
  async checkStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const transaction = await this.repo.findOne({ where: { id } });

    if (!transaction) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: 'Transacción no encontrada',
      });
    }

    const finalStatuses = [
      TransactionStatus.APPROVED,
      TransactionStatus.DECLINED,
      TransactionStatus.ERROR,
      TransactionStatus.VOIDED,
    ];

    if (finalStatuses.includes(transaction.status)) {
      return res.status(HttpStatus.OK).json({
        success: true,
        data: {
          transactionId: transaction.id,
          status: transaction.status,
          gatewayTransactionId: transaction.gatewayTransactionId,
        },
      });
    }

    if (!transaction.gatewayTransactionId) {
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { transactionId: transaction.id, status: 'PENDING' },
      });
    }

    const statusResult = await this.getTransactionStatus.execute(
      transaction.gatewayTransactionId,
    );

    if (statusResult.isFailure) {
      return res.status(HttpStatus.OK).json({
        success: true,
        data: { transactionId: transaction.id, status: 'PENDING' },
      });
    }

    const { status } = statusResult.value;

    if (finalStatuses.includes(status as TransactionStatus)) {
      const updateResult = await this.repo
        .createQueryBuilder()
        .update(TransactionEntity)
        .set({ status: status as TransactionStatus })
        .where('id = :id', { id })
        .andWhere('status = :currentStatus', {
          currentStatus: TransactionStatus.PENDING,
        })
        .execute();

      if (updateResult.affected === 0) {
        return res.status(HttpStatus.OK).json({
          success: true,
          data: { transactionId: transaction.id, status },
        });
      }

      if (status === 'APPROVED') {
        await this.productRepo.decrementStock(transaction.productId);

        await this.deliveryRepo.create({
          transactionId: transaction.id,
          customerId: transaction.customerId,
          address: transaction.deliveryAddress,
          city: transaction.deliveryCity,
          department: transaction.deliveryDepartment,
        });
      }
    }

    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        transactionId: transaction.id,
        status,
      },
    });
  }
}
