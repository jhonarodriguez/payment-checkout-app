import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductRepositoryPort } from '../../../products/domain/ports/product.repository.port';
import { CustomerRepositoryPort } from '../../../customers/domain/ports/customer.repository.port';
import { PaymentGatewayPort } from '../../../payments/domain/ports/payment-gateway.port';
import { CreateTransactionDto } from '../../infrastructure/dto/create-transaction.dto';
import { TransactionStatus } from '../../infrastructure/adapters/transaction.entity';
import { Result } from '../../../../shared/result';
import { TransactionRepositoryPort } from '../../domain/ports/transaction.repository.port';
import {
  NotFoundError,
  ValidationError,
} from '../../../../shared/errors/domain-errors';
import { DeliveryRepositoryPort } from '../../../deliveries/domain/ports/delivery.repository.port';

@Injectable()
export class ProcessPaymentUseCase {
  private readonly baseFeeInCents: number;
  private readonly deliveryFeeInCents: number;

  constructor(
    @Inject('TRANSACTION_REPOSITORY')
    private readonly transactionRepo: TransactionRepositoryPort,

    @Inject('PRODUCT_REPOSITORY')
    private readonly productRepo: ProductRepositoryPort,

    @Inject('CUSTOMER_REPOSITORY')
    private readonly customerRepo: CustomerRepositoryPort,

    @Inject('DELIVERY_REPOSITORY')
    private readonly deliveryRepo: DeliveryRepositoryPort,

    @Inject('PAYMENT_GATEWAY')
    private readonly paymentGateway: PaymentGatewayPort,

    private readonly configService: ConfigService,
  ) {
    this.baseFeeInCents =
      this.configService.get<number>('BASE_FEE_IN_CENTS') || 300000;
    this.deliveryFeeInCents =
      this.configService.get<number>('DELIVERY_FEE_IN_CENTS') || 200000;
  }

  async execute(dto: CreateTransactionDto): Promise<Result<any>> {
    const productResult = await this.getProductWithStock(dto.productId);
    if (productResult.isFailure) return productResult;

    const product = productResult.value;

    const customerResult = await this.getOrCreateCustomer(dto);
    if (customerResult.isFailure) return customerResult;

    const customer = customerResult.value;

    const totalInCents =
      Number(product.priceInCents) +
      Number(this.baseFeeInCents) +
      Number(this.deliveryFeeInCents);

    const transactionResult = await this.createPendingTransaction({
      customerId: customer.id,
      productId: product.id,
      productAmountInCents: product.priceInCents,
      baseFeeInCents: this.baseFeeInCents,
      deliveryFeeInCents: this.deliveryFeeInCents,
      totalInCents,
      cardLastFour: dto.cardLastFour,
      deliveryAddress: dto.deliveryAddress,
      deliveryCity: dto.deliveryCity,
      deliveryDepartment: dto.deliveryDepartment,
    });
    if (transactionResult.isFailure) return transactionResult;

    const transaction = transactionResult.value;

    const paymentResult = await this.paymentGateway.processPayment({
      reference: transaction.reference,
      amountInCents: totalInCents,
      cardToken: dto.cardToken,
      acceptanceToken: dto.acceptanceToken,
      customerEmail: dto.customerEmail,
    });

    if (paymentResult.isFailure) {
      await this.transactionRepo.updateStatus(
        transaction.id,
        TransactionStatus.ERROR,
        null,
      );
      return Result.fail(
        new Error('Error al conectar con la pasarela de pago'),
      );
    }

    await this.transactionRepo.updateStatus(
      transaction.id,
      paymentResult.value.status as TransactionStatus,
      paymentResult.value.gatewayId,
    );

    if (paymentResult.value.status === 'APPROVED') {
      await this.deliveryRepo.create({
        transactionId: transaction.id,
        customerId: customer.id,
        address: dto.deliveryAddress,
        city: dto.deliveryCity,
        department: dto.deliveryDepartment,
      });
      await this.productRepo.decrementStock(product.id);
    }

    return Result.ok({
      transactionId: transaction.id,
      reference: transaction.reference,
      status: paymentResult.value.status,
      totalInCents,
      product: {
        id: product.id,
        name: product.name,
      },
      delivery: {
        address: dto.deliveryAddress,
        city: dto.deliveryCity,
      },
    });
  }

  private async getProductWithStock(productId: string): Promise<Result<any>> {
    try {
      if (!productId || typeof productId !== 'string') {
        return Result.fail(new ValidationError('ID de producto inválido'));
      }
      const product = await this.productRepo.findById(productId);
      if (!product) {
        return Result.fail(new NotFoundError('Producto', productId));
      }
      if (!product.hasStock()) {
        return Result.fail(new Error('El producto no tiene stock disponible'));
      }
      return Result.ok(product);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? error
          : new Error('Error al verificar el producto'),
      );
    }
  }

  private async getOrCreateCustomer(
    dto: CreateTransactionDto,
  ): Promise<Result<any>> {
    try {
      let customer = await this.customerRepo.findByEmail(dto.customerEmail);
      if (!customer) {
        customer = await this.customerRepo.create({
          fullName: dto.customerName,
          email: dto.customerEmail,
        });
      }
      return Result.ok(customer);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? error
          : new Error('Error al procesar los datos del cliente'),
      );
    }
  }

  private async createPendingTransaction(data: any): Promise<Result<any>> {
    try {
      const reference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const transaction = await this.transactionRepo.create({
        ...data,
        reference,
        status: TransactionStatus.PENDING,
      });
      return Result.ok(transaction);
    } catch (error) {
      return Result.fail(
        error instanceof Error
          ? error
          : new Error('Error al crear la transacción'),
      );
    }
  }
}
