// ============================================================================
// INVENTORY SERVICE - REQUIRED MODIFICATIONS
// Based on frontend API expectations from lib/api.ts and types
// ============================================================================

// =============================================================================
// FILE: src/inventory/entities/product.entity.ts
// ACTION: MODIFY - Add new fields required by frontend
// =============================================================================

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ name: 'quantity_in_stock', type: 'int', default: 0 })
  quantityInStock: number;

  // === NEW FIELDS REQUIRED BY FRONTEND ===

  @Column({ name: 'reserved_quantity', type: 'int', default: 0 })
  reservedQuantity: number;

  @Column({ name: 'available_quantity', type: 'int', default: 0 })
  availableQuantity: number;

  @Column({ name: 'previous_quantity', type: 'int', default: 0 })
  previousQuantity: number;

  @Column({ name: 'reorder_level', type: 'int', default: 10 })
  reorderLevel: number;

  @Column({ name: 'reorder_quantity', type: 'int', nullable: true })
  reorderQuantity: number;

  @Column({ name: 'min_stock_level', type: 'int', default: 0 })
  minStockLevel: number;

  @Column({ name: 'max_stock_level', type: 'int', nullable: true })
  maxStockLevel: number;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 10, scale: 2, nullable: true })
  weightKg: number;

  @Column({ name: 'dimensions_cm', type: 'varchar', length: 50, nullable: true })
  dimensionsCm: string;

  @Column({ name: 'warehouse_id', type: 'uuid', nullable: true })
  warehouseId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Calculate available quantity before save
  @BeforeInsert()
  @BeforeUpdate()
  calculateAvailableQuantity() {
    this.availableQuantity = this.quantityInStock - (this.reservedQuantity || 0);
  }
}
