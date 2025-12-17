
// =============================================================================
// FILE: src/inventory/entities/stock-movement.entity.ts
// ACTION: CREATE NEW - For tracking inventory movements
// =============================================================================

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

export enum MovementType {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVATION = 'RESERVATION',
  RETURN = 'RETURN',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'from_location_id', type: 'uuid', nullable: true })
  fromLocationId: string;

  @Column({ name: 'to_location_id', type: 'uuid', nullable: true })
  toLocationId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'previous_quantity', type: 'int' })
  previousQuantity: number;

  @Column({ name: 'new_quantity', type: 'int' })
  newQuantity: number;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string;

  @Column({ name: 'performed_by', type: 'varchar', length: 255 })
  performedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}