import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RouteStop } from './route-stop.entity';

export enum RouteStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum RouteType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  MIXED = 'MIXED',
  RETURN = 'RETURN',
}

export enum RoutePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum VehicleType {
  BIKE = 'BIKE',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  REFRIGERATED = 'REFRIGERATED',
}

@Entity('delivery_routes')
@Index(['status', 'routeDate'])
@Index(['driverId', 'routeDate'])
@Index(['routeNumber'], { unique: true })
export class DeliveryRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  routeNumber: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  driverId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  driverName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  driverPhone: string;

  @Column({ type: 'uuid', nullable: true })
  vehicleId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  vehiclePlate: string;

  @Column({
    type: 'enum',
    enum: VehicleType,
    default: VehicleType.VAN,
  })
  vehicleType: VehicleType;

  @Column({ type: 'date' })
  @Index()
  routeDate: Date;

  @Column({
    type: 'enum',
    enum: RouteStatus,
    default: RouteStatus.DRAFT,
  })
  @Index()
  status: RouteStatus;

  @Column({
    type: 'enum',
    enum: RouteType,
    default: RouteType.DELIVERY,
  })
  routeType: RouteType;

  @Column({
    type: 'enum',
    enum: RoutePriority,
    default: RoutePriority.NORMAL,
  })
  priority: RoutePriority;

  @Column({ type: 'uuid', nullable: true })
  warehouseId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  warehouseName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  zone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  // Route metrics
  @Column({ type: 'int', default: 0 })
  totalStops: number;

  @Column({ type: 'int', default: 0 })
  completedStops: number;

  @Column({ type: 'int', default: 0 })
  failedStops: number;

  @Column({ type: 'int', default: 0 })
  skippedStops: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  completionPercentage: number;

  // Distance and time estimates
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedDistanceKm: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualDistanceKm: number;

  @Column({ type: 'int', nullable: true })
  estimatedDurationMinutes: number;

  @Column({ type: 'int', nullable: true })
  actualDurationMinutes: number;

  // Time tracking
  @Column({ type: 'timestamp', nullable: true })
  plannedStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  plannedEndTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualEndTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  // Capacity tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxVolumeM3: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentVolumeM3: number;

  @Column({ type: 'int', nullable: true })
  maxPackages: number;

  @Column({ type: 'int', default: 0 })
  currentPackages: number;

  // GPS tracking
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  currentLongitude: number;

  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdate: Date;

  // Route optimization
  @Column({ type: 'boolean', default: false })
  isOptimized: boolean;

  @Column({ type: 'timestamp', nullable: true })
  optimizedAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  optimizationAlgorithm: string;

  // Special handling
  @Column({ type: 'boolean', default: false })
  hasFragileItems: boolean;

  @Column({ type: 'boolean', default: false })
  hasHazardousItems: boolean;

  @Column({ type: 'boolean', default: false })
  requiresSignature: boolean;

  @Column({ type: 'boolean', default: false })
  requiresIdVerification: boolean;

  @Column({ type: 'boolean', default: false })
  hasTemperatureControl: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  minTemperature: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  maxTemperature: number;

  // Notes and instructions
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  driverInstructions: string;

  @Column({ type: 'text', nullable: true })
  dispatchNotes: string;

  // Audit fields
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;

  @Column({ type: 'uuid', nullable: true })
  assignedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => RouteStop, (stop) => stop.route, { cascade: true })
  stops: RouteStop[];
}