import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { PickList } from './picklist.entity';

export enum PickListItemStatus {
  PENDING = 'PENDING',
  LOCATED = 'LOCATED',
  PICKED = 'PICKED',
  VERIFIED = 'VERIFIED',
  SHORT = 'SHORT',
  DAMAGED = 'DAMAGED',
  SKIPPED = 'SKIPPED',
  SUBSTITUTED = 'SUBSTITUTED',
}

@Entity('picklist_items')
export class PickListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PickList, (pickList) => pickList.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pickListId' })
  pickList: PickList;

  @Column('uuid')
  pickListId: string;

  // Product info
  @Column('uuid')
  productId: string;

  @Column({ nullable: true })
  productSku: string;

  @Column({ nullable: true })
  productName: string;

  @Column({ type: 'text', nullable: true })
  productDescription: string;

  // Quantities
  @Column('int')
  quantityRequired: number;

  @Column({ default: 0 })
  quantityPicked: number;

  @Column({ default: 0 })
  quantityShort: number;

  // Status
  @Column({
    type: 'enum',
    enum: PickListItemStatus,
    default: PickListItemStatus.PENDING,
  })
  status: PickListItemStatus;

  // Location details
  @Column()
  location: string;

  @Column({ nullable: true })
  aisle: string;

  @Column({ nullable: true })
  rack: string;

  @Column({ nullable: true })
  shelf: string;

  @Column({ nullable: true })
  bin: string;

  @Column({ nullable: true })
  zone: string;

  @Column({ default: 0 })
  pickSequence: number;

  // Tracking
  @Column({ nullable: true })
  lotNumber: string;

  @Column({ nullable: true })
  serialNumber: string;

  @Column({ type: 'date', nullable: true })
  expirationDate: Date;

  @Column({ nullable: true })
  barcode: string;

  // Physical attributes
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitWeight: number;

  @Column({ default: 'kg' })
  weightUnit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @Column({ nullable: true })
  imageUrl: string;

  // Picking info
  @Column({ nullable: true })
  pickedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  pickedAt: Date;

  @Column({ nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  // Substitution
  @Column('uuid', { nullable: true })
  substituteProductId: string;

  @Column({ nullable: true })
  substituteReason: string;

  // Flags
  @Column({ default: false })
  requiresSerialScan: boolean;

  @Column({ default: false })
  requiresLotTracking: boolean;

  @Column({ default: false })
  isHazardous: boolean;

  @Column({ default: false })
  isFragile: boolean;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
