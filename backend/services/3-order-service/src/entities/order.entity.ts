import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    BeforeInsert,
  } from 'typeorm';
  import { OrderItem } from '../order/entities/order-item.entity';
  import { ApiProperty } from '@nestjs/swagger';
  
  export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    RETURNED = 'RETURNED',
  }
  
  export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
    FAILED = 'FAILED',
  }
  
  export enum DeliveryType {
    TRUCK = 'Truck',
    TRAIN = 'Train',
    FLIGHT = 'Flight',
    SHIP = 'Ship',
  }
  
  @Entity('orders')
  export class Order {
    @PrimaryGeneratedColumn('uuid')
    @ApiProperty({ description: 'Unique order identifier' })
    id: string;
  
    @Column({ name: 'order_number', unique: true })
    @ApiProperty({ description: 'Human-readable order number', example: 'ORD-2024-001234' })
    orderNumber: string;
  
    @Column({ name: 'customer_id', type: 'uuid' })
    @ApiProperty({ description: 'Customer UUID' })
    customerId: string;
  
    @Column({ name: 'customer_name' })
    @ApiProperty({ description: 'Customer name for display' })
    customerName: string;
  
    @Column({
      type: 'enum',
      enum: OrderStatus,
      default: OrderStatus.PENDING,
    })
    @ApiProperty({ enum: OrderStatus, description: 'Current order status' })
    status: OrderStatus;
  
    @Column({
      name: 'payment_status',
      type: 'enum',
      enum: PaymentStatus,
      default: PaymentStatus.PENDING,
    })
    @ApiProperty({ enum: PaymentStatus, description: 'Payment status' })
    paymentStatus: PaymentStatus;
  
    @Column({ type: 'decimal', precision: 12, scale: 2 })
    @ApiProperty({ description: 'Order subtotal before tax/shipping' })
    subtotal: number;
  
    @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    @ApiProperty({ description: 'Tax amount' })
    taxAmount: number;
  
    @Column({ name: 'shipping_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
    @ApiProperty({ description: 'Shipping cost' })
    shippingCost: number;
  
    @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    @ApiProperty({ description: 'Discount amount' })
    discountAmount: number;
  
    @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2 })
    @ApiProperty({ description: 'Total order amount' })
    totalAmount: number;
  
    @Column({ name: 'amount_paid', type: 'decimal', precision: 12, scale: 2, default: 0 })
    @ApiProperty({ description: 'Amount already paid' })
    amountPaid: number;
  
    @Column({ name: 'shipping_address', type: 'text' })
    @ApiProperty({ description: 'Shipping address' })
    shippingAddress: string;
  
    @Column({ name: 'shipping_city', nullable: true })
    shippingCity: string;
  
    @Column({ name: 'shipping_state', nullable: true })
    shippingState: string;
  
    @Column({ name: 'shipping_postal_code', nullable: true })
    shippingPostalCode: string;
  
    @Column({ name: 'shipping_country', default: 'USA' })
    shippingCountry: string;
  
    @Column({
      name: 'delivery_type',
      type: 'enum',
      enum: DeliveryType,
      default: DeliveryType.TRUCK,
    })
    @ApiProperty({ enum: DeliveryType, description: 'Delivery method' })
    deliveryType: DeliveryType;
  
    @Column({ name: 'transit_id', type: 'uuid', nullable: true })
    @ApiProperty({ description: 'Linked delivery/transit ID for tracking' })
    transitId: string;
  
    @Column({ name: 'payment_method', nullable: true })
    @ApiProperty({ description: 'Payment method used' })
    paymentMethod: string;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @CreateDateColumn({ name: 'order_date' })
    @ApiProperty({ description: 'Order creation date' })
    orderDate: Date;
  
    @Column({ name: 'expected_delivery_date', type: 'timestamp with time zone', nullable: true })
    @ApiProperty({ description: 'Expected delivery date' })
    expectedDeliveryDate: Date;
  
    @Column({ name: 'confirmed_at', type: 'timestamp with time zone', nullable: true })
    confirmedAt: Date;
  
    @Column({ name: 'shipped_at', type: 'timestamp with time zone', nullable: true })
    shippedAt: Date;
  
    @Column({ name: 'delivered_at', type: 'timestamp with time zone', nullable: true })
    deliveredAt: Date;
  
    @Column({ name: 'cancelled_at', type: 'timestamp with time zone', nullable: true })
    cancelledAt: Date;
  
    @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
    cancellationReason: string;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
  
    @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
    items: OrderItem[];
  
    @BeforeInsert()
    generateOrderNumber() {
      const year = new Date().getFullYear();
      const random = Math.floor(100000 + Math.random() * 900000);
      this.orderNumber = `ORD-${year}-${random}`;
    }
  }