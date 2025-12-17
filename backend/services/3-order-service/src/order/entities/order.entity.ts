import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  ON_HOLD = 'ON_HOLD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum DeliveryType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  OVERNIGHT = 'OVERNIGHT',
  SAME_DAY = 'SAME_DAY',
  PICKUP = 'PICKUP',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the order' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Human-readable order number (e.g., ORD-2024-000001)' })
  orderNumber: string;

  @Column('uuid')
  @ApiProperty({ description: 'Customer ID who placed the order' })
  customerId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Customer name for display purposes' })
  customerName: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Customer email for notifications' })
  customerEmail: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Customer phone number' })
  customerPhone: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Date when order was created' })
  orderDate: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Date when order was last updated' })
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @ApiProperty({ enum: OrderStatus, description: 'Current status of the order' })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @ApiProperty({ enum: PaymentStatus, description: 'Payment status of the order' })
  paymentStatus: PaymentStatus;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Subtotal before tax and shipping' })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Shipping cost' })
  shippingCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Discount amount applied' })
  discountAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Total order amount' })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Amount already paid' })
  amountPaid: number;

  @Column('text')
  @ApiProperty({ description: 'Shipping address' })
  shippingAddress: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'City for shipping' })
  shippingCity: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'State/Province for shipping' })
  shippingState: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Country for shipping' })
  shippingCountry: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Postal/ZIP code for shipping' })
  shippingZipCode: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Billing address (if different from shipping)' })
  billingAddress: string;

  @Column({
    type: 'enum',
    enum: DeliveryType,
    default: DeliveryType.STANDARD,
  })
  @ApiProperty({ enum: DeliveryType, description: 'Type of delivery selected' })
  deliveryType: DeliveryType;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Expected delivery date' })
  expectedDeliveryDate: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Actual delivery date' })
  actualDeliveryDate: Date;

  @Column('uuid', { nullable: true })
  @ApiProperty({ description: 'Reference to delivery/transit record' })
  transitId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Tracking number for shipment' })
  trackingNumber: string;

  @Column('uuid', { nullable: true })
  @ApiProperty({ description: 'Warehouse ID fulfilling the order' })
  warehouseId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Special instructions or notes' })
  notes: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Internal notes (not visible to customer)' })
  internalNotes: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Reason for cancellation (if cancelled)' })
  cancellationReason: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Date when order was cancelled' })
  cancelledAt: Date;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Payment method used' })
  paymentMethod: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Payment transaction reference' })
  paymentReference: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether order is a priority order' })
  isPriority: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether order is a gift' })
  isGift: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Gift message if order is a gift' })
  giftMessage: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  @ApiProperty({ type: () => [OrderItem], description: 'Order line items' })
  items: OrderItem[];

  @BeforeInsert()
  generateOrderNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    this.orderNumber = `ORD-${year}-${random}`;
  }
}