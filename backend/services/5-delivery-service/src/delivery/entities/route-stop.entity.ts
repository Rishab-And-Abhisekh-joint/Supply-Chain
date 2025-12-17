import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DeliveryRoute } from './delivery-route.entity';

export enum StopStatus {
  PENDING = 'PENDING',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  FAILED = 'FAILED',
  RESCHEDULED = 'RESCHEDULED',
  CANCELLED = 'CANCELLED',
  SKIPPED = 'SKIPPED',
}

export enum StopType {
  DELIVERY = 'DELIVERY',
  PICKUP = 'PICKUP',
  RETURN = 'RETURN',
  EXCHANGE = 'EXCHANGE',
  SERVICE = 'SERVICE',
}

export enum FailureReason {
  CUSTOMER_NOT_HOME = 'CUSTOMER_NOT_HOME',
  WRONG_ADDRESS = 'WRONG_ADDRESS',
  REFUSED_DELIVERY = 'REFUSED_DELIVERY',
  DAMAGED_PACKAGE = 'DAMAGED_PACKAGE',
  ACCESS_DENIED = 'ACCESS_DENIED',
  WEATHER_CONDITIONS = 'WEATHER_CONDITIONS',
  VEHICLE_ISSUE = 'VEHICLE_ISSUE',
  CUSTOMER_REQUESTED_RESCHEDULE = 'CUSTOMER_REQUESTED_RESCHEDULE',
  BUSINESS_CLOSED = 'BUSINESS_CLOSED',
  OTHER = 'OTHER',
}

export enum DeliveryLocation {
  FRONT_DOOR = 'FRONT_DOOR',
  BACK_DOOR = 'BACK_DOOR',
  GARAGE = 'GARAGE',
  MAILROOM = 'MAILROOM',
  RECEPTION = 'RECEPTION',
  LOCKER = 'LOCKER',
  NEIGHBOR = 'NEIGHBOR',
  SAFE_PLACE = 'SAFE_PLACE',
  HANDED_TO_CUSTOMER = 'HANDED_TO_CUSTOMER',
  OTHER = 'OTHER',
}

@Entity('route_stops')
@Index(['routeId', 'plannedSequence'])
@Index(['orderId'])
@Index(['status'])
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DeliveryRoute, (route) => route.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: DeliveryRoute;

  @Column({ type: 'uuid' })
  @Index()
  routeId: string;

  @Column({ type: 'uuid' })
  @Index()
  orderId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  orderNumber: string;

  @Column({
    type: 'enum',
    enum: StopType,
    default: StopType.DELIVERY,
  })
  stopType: StopType;

  @Column({
    type: 'enum',
    enum: StopStatus,
    default: StopStatus.PENDING,
  })
  @Index()
  status: StopStatus;

  // Sequence
  @Column({ type: 'int' })
  plannedSequence: number;

  @Column({ type: 'int', nullable: true })
  actualSequence: number;

  // Customer information
  @Column({ type: 'uuid', nullable: true })
  customerId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  customerPhone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerEmail: string;

  // Address information
  @Column({ type: 'text' })
  deliveryAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine1: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  addressLine2: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  // GPS coordinates
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  // Time window
  @Column({ type: 'timestamp', nullable: true })
  timeWindowStart: Date;

  @Column({ type: 'timestamp', nullable: true })
  timeWindowEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  estimatedArrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualArrivalTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  departureTime: Date;

  // Duration tracking
  @Column({ type: 'int', nullable: true })
  estimatedServiceMinutes: number;

  @Column({ type: 'int', nullable: true })
  actualServiceMinutes: number;

  @Column({ type: 'int', nullable: true })
  waitTimeMinutes: number;

  // Package information
  @Column({ type: 'int', default: 1 })
  packageCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalWeightKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalVolumeM3: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  packageType: string;

  // Delivery requirements
  @Column({ type: 'boolean', default: false })
  requiresSignature: boolean;

  @Column({ type: 'boolean', default: false })
  requiresIdVerification: boolean;

  @Column({ type: 'boolean', default: false })
  requiresAdultSignature: boolean;

  @Column({ type: 'boolean', default: false })
  isFragile: boolean;

  @Column({ type: 'boolean', default: false })
  isHazardous: boolean;

  @Column({ type: 'boolean', default: false })
  requiresTemperatureControl: boolean;

  @Column({ type: 'boolean', default: false })
  isCashOnDelivery: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  codAmount: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  codCurrency: string;

  @Column({ type: 'boolean', default: false })
  codCollected: boolean;

  // Proof of delivery
  @Column({
    type: 'enum',
    enum: DeliveryLocation,
    nullable: true,
  })
  deliveryLocation: DeliveryLocation;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientName: string;

  @Column({ type: 'text', nullable: true })
  signatureUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  photoUrls: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  relationToCustomer: string;

  // Failure information
  @Column({
    type: 'enum',
    enum: FailureReason,
    nullable: true,
  })
  failureReason: FailureReason;

  @Column({ type: 'text', nullable: true })
  failureNotes: string;

  @Column({ type: 'int', default: 0 })
  attemptNumber: number;

  @Column({ type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  nextAttemptDate: Date;

  // Special instructions
  @Column({ type: 'text', nullable: true })
  deliveryInstructions: string;

  @Column({ type: 'text', nullable: true })
  accessCode: string;

  @Column({ type: 'text', nullable: true })
  customerNotes: string;

  @Column({ type: 'text', nullable: true })
  driverNotes: string;

  // Priority
  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: false })
  isUrgent: boolean;

  // Distance from previous stop
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceFromPreviousKm: number;

  @Column({ type: 'int', nullable: true })
  drivingTimeFromPreviousMinutes: number;

  // Rating
  @Column({ type: 'int', nullable: true })
  customerRating: number;

  @Column({ type: 'text', nullable: true })
  customerFeedback: string;

  // Notifications
  @Column({ type: 'boolean', default: false })
  notificationSent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  notificationSentAt: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  notificationType: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}