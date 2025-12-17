import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PickListItem } from './picklist-item.entity';

export enum PickListStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_PICKED = 'PARTIALLY_PICKED',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum PickListPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum PickListType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  BATCH = 'BATCH',
  WAVE = 'WAVE',
}

@Entity('picklists')
export class PickList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  pickListNumber: string;

  @Column('uuid')
  orderId: string;

  @Column({ nullable: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: PickListStatus,
    default: PickListStatus.PENDING,
  })
  status: PickListStatus;

  @Column({
    type: 'enum',
    enum: PickListPriority,
    default: PickListPriority.NORMAL,
  })
  priority: PickListPriority;

  @Column({
    type: 'enum',
    enum: PickListType,
    default: PickListType.STANDARD,
  })
  type: PickListType;

  // Assignment
  @Column({ nullable: true })
  assignedTo: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  // Location
  @Column({ nullable: true })
  warehouseId: string;

  @Column({ nullable: true })
  zone: string;

  // Progress tracking
  @Column({ default: 0 })
  totalItems: number;

  @Column({ default: 0 })
  pickedItems: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  // Shipping info
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedWeight: number;

  @Column({ default: 'kg' })
  weightUnit: string;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  shippingMethod: string;

  @Column({ type: 'date', nullable: true })
  expectedShipDate: Date;

  // Flags
  @Column({ default: false })
  isRush: boolean;

  @Column({ default: false })
  requiresVerification: boolean;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  specialInstructions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PickListItem, (item) => item.pickList, {
    cascade: true,
    eager: true,
  })
  items: PickListItem[];
}
