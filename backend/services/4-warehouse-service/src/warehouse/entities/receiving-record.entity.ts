import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ReceivingItem } from './receiving-item.entity';

export enum ReceivingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_QC = 'PENDING_QC',
  COMPLETED = 'COMPLETED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum ReceivingType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('receiving_records')
export class ReceivingRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  receivingNumber: string;

  @Column({
    type: 'enum',
    enum: ReceivingStatus,
    default: ReceivingStatus.SCHEDULED,
  })
  status: ReceivingStatus;

  @Column({
    type: 'enum',
    enum: ReceivingType,
    default: ReceivingType.PURCHASE_ORDER,
  })
  type: ReceivingType;

  // Purchase Order info
  @Column('uuid', { nullable: true })
  purchaseOrderId: string;

  @Column({ nullable: true })
  purchaseOrderNumber: string;

  // Supplier info
  @Column('uuid', { nullable: true })
  supplierId: string;

  @Column({ nullable: true })
  supplierName: string;

  // Location
  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  receivingDock: string;

  // Dates
  @Column({ type: 'date', nullable: true })
  expectedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  receivedDate: Date;

  @Column({ nullable: true })
  receivedBy: string;

  // Totals
  @Column({ default: 0 })
  totalItemsExpected: number;

  @Column({ default: 0 })
  totalItemsReceived: number;

  @Column({ default: 0 })
  totalQuantityExpected: number;

  @Column({ default: 0 })
  totalQuantityReceived: number;

  // Shipping info
  @Column({ nullable: true })
  carrierName: string;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  billOfLading: string;

  @Column({ default: 0 })
  palletCount: number;

  @Column({ default: 0 })
  cartonCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalWeight: number;

  @Column({ default: 'kg' })
  weightUnit: string;

  // Quality check
  @Column({ default: false })
  requiresQualityCheck: boolean;

  @Column({ nullable: true })
  qualityCheckBy: string;

  @Column({ type: 'timestamp', nullable: true })
  qualityCheckDate: Date;

  @Column({ type: 'text', nullable: true })
  qualityCheckNotes: string;

  // Discrepancy
  @Column({ default: false })
  hasDiscrepancy: boolean;

  @Column({ type: 'text', nullable: true })
  discrepancyNotes: string;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ReceivingItem, (item) => item.receivingRecord, {
    cascade: true,
    eager: true,
  })
  items: ReceivingItem[];
}
