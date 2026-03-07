import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TransactionEntity } from '../../../transactions/infrastructure/adapters/transaction.entity';
import { CustomerEntity } from '../../../customers/infrastructure/adapters/customer.entity';

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
}

@Entity('deliveries')
export class DeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TransactionEntity)
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => CustomerEntity)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity;

  @Column({ name: 'customer_id' })
  customerId: string;

  @Column({ type: 'varchar', length: 500 })
  address: string;

  @Column({ type: 'varchar', length: 255 })
  city: string;

  @Column({ type: 'varchar', length: 255 })
  department: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
