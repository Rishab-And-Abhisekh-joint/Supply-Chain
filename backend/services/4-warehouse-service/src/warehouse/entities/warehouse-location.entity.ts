import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum LocationType {
  STORAGE = 'STORAGE',
  PICKING = 'PICKING',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  STAGING = 'STAGING',
  RETURNS = 'RETURNS',
  QUARANTINE = 'QUARANTINE',
}

export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FULL = 'FULL',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
}

@Entity('warehouse_locations')
export class WarehouseLocation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  locationCode: string;

  @Column({ nullable: true })
  warehouseId: string;

  // Location hierarchy
  @Column({ nullable: true })
  zone: string;

  @Column({ nullable: true })
  aisle: string;

  @Column({ nullable: true })
  rack: string;

  @Column({ nullable: true })
  shelf: string;

  @Column({ nullable: true })
  bin: string;

  // Type and status
  @Column({
    type: 'enum',
    enum: LocationType,
    default: LocationType.STORAGE,
  })
  type: LocationType;

  @Column({
    type: 'enum',
    enum: LocationStatus,
    default: LocationStatus.ACTIVE,
  })
  status: LocationStatus;

  // Capacity
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeight: number;

  @Column({ default: 'kg' })
  weightUnit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxVolume: number;

  @Column({ default: 'm3' })
  volumeUnit: string;

  // Dimensions
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  height: number;

  @Column({ default: 'cm' })
  dimensionUnit: string;

  // Current usage
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentVolume: number;

  @Column({ default: 0 })
  currentItemCount: number;

  // Temperature control
  @Column({ default: false })
  isTemperatureControlled: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minTemperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxTemperature: number;

  @Column({ default: 'C' })
  temperatureUnit: string;

  // Flags
  @Column({ default: false })
  isHazardous: boolean;

  @Column({ default: false })
  isHighValue: boolean;

  // Pick priority (lower = pick first)
  @Column({ default: 100 })
  pickPriority: number;

  // Notes
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
