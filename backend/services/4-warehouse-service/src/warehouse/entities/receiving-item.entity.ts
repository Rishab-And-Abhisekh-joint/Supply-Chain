import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { ReceivingRecord } from './receiving-record.entity';

export enum ReceivingItemStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  REJECTED = 'REJECTED',
  DAMAGED = 'DAMAGED',
  QUARANTINED = 'QUARANTINED',
}

export enum ReceivingItemCondition {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  WRONG_ITEM = 'WRONG_ITEM',
  MISSING = 'MISSING',
}

@Entity('receiving_items')
export class ReceivingItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ReceivingRecord, (record) => record.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receivingRecordId' })
  receivingRecord: ReceivingRecord;

  @Column('uuid')
  receivingRecordId: string;

  // Product info
  @Column('uuid')
  productId: string;

  @Column({ nullable: true })
  productSku: string;

  @Column({ nullable: true })
  productName: string;

  // Quantities
  @Column('int')
  quantityExpected: number;

  @Column({ default: 0 })
  quantityReceived: number;

  @Column({ default: 0 })
  quantityRejected: number;

  @Column({ default: 0 })
  quantityDamaged: number;

  // Status
  @Column({
    type: 'enum',
    enum: ReceivingItemStatus,
    default: ReceivingItemStatus.PENDING,
  })
  status: ReceivingItemStatus;

  @Column({
    type: 'enum',
    enum: ReceivingItemCondition,
    default: ReceivingItemCondition.GOOD,
  })
  condition: ReceivingItemCondition;

  // Location assignment
  @Column({ nullable: true })
  locationCode: string;

  // Tracking
  @Column({ nullable: true })
  lotNumber: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ type: 'date', nullable: true })
  manufacturingDate: Date;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  barcode: string;

  // Cost
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitWeight: number;

  @Column({ default: 'kg' })
  weightUnit: string;

  // Processing
  @Column({ nullable: true })
  receivedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ nullable: true })
  inspectedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  inspectedAt: Date;

  // Flags
  @Column({ default: false })
  requiresInspection: boolean;

  @Column({ default: false })
  isQuarantined: boolean;

  // Notes
  @Column({ type: 'text', nullable: true })
  inspectionNotes: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
