import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum OrderItemStatus {
  PENDING = 'PENDING',
  RESERVED = 'RESERVED',
  PICKED = 'PICKED',
  PACKED = 'PACKED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
  BACKORDERED = 'BACKORDERED',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the order item' })
  id: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column('uuid')
  @ApiProperty({ description: 'Reference to the order' })
  orderId: string;

  @Column('uuid')
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Product SKU at time of order' })
  productSku: string;

  @Column()
  @ApiProperty({ description: 'Product name at time of order' })
  productName: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Product description' })
  productDescription: string;

  @Column('int')
  @ApiProperty({ description: 'Quantity ordered' })
  quantity: number;

  @Column('int', { default: 0 })
  @ApiProperty({ description: 'Quantity already fulfilled/shipped' })
  quantityFulfilled: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Unit price at time of order' })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Discount applied to this item' })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  @ApiProperty({ description: 'Tax amount for this item' })
  taxAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'Total price (quantity * unitPrice - discount + tax)' })
  totalPrice: number;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  @ApiProperty({ enum: OrderItemStatus, description: 'Status of this line item' })
  status: OrderItemStatus;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Product image URL' })
  imageUrl: string;

  @Column('decimal', { precision: 10, scale: 3, nullable: true })
  @ApiProperty({ description: 'Weight of the item (for shipping calculation)' })
  weight: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Unit of weight measurement' })
  weightUnit: string;

  @Column('uuid', { nullable: true })
  @ApiProperty({ description: 'Warehouse fulfilling this item' })
  warehouseId: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Bin location in warehouse' })
  binLocation: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Lot/batch number' })
  lotNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Serial number (for serialized items)' })
  serialNumber: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Notes specific to this item' })
  notes: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether stock has been reserved' })
  stockReserved: boolean;

  @Column({ nullable: true })
  @ApiProperty({ description: 'Stock reservation ID' })
  reservationId: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Date item was added to order' })
  createdAt: Date;
}