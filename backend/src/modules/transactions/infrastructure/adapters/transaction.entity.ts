import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CustomerEntity } from '../../../customers/infrastructure/adapters/customer.entity';
import { ProductEntity } from '../../../products/infrastructure/adapters/product.entity';

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  ERROR = 'ERROR',
  VOIDED = 'VOIDED',
}

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Referencia única que enviamos a Wompi
  // Formato: TXN-{timestamp}-{random}
  @Column({ type: 'varchar', length: 100, unique: true })
  reference: string;

  @ManyToOne(() => CustomerEntity)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => ProductEntity)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ type: 'integer', name: 'product_amount_in_cents' })
  productAmountInCents: number;

  @Column({ type: 'integer', name: 'base_fee_in_cents' })
  baseFeeInCents: number;

  @Column({ type: 'integer', name: 'delivery_fee_in_cents' })
  deliveryFeeInCents: number;

  @Column({ type: 'integer', name: 'total_in_cents' })
  totalInCents: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    name: 'gateway_transaction_id',
  })
  gatewayTransactionId: string | null;

  @Column({
    type: 'varchar',
    length: 4,
    nullable: true,
    name: 'card_last_four',
  })
  cardLastFour: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
