import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'The unique identifier of the product.' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'Stock Keeping Unit - a unique code for the product.' })
  sku: string;

  @Column()
  @ApiProperty({ description: 'The name of the product.' })
  name: string;

  @Column('text', { nullable: true })
  @ApiProperty({ description: 'A detailed description of the product.', required: false })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @ApiProperty({ description: 'The price of the product.' })
  price: number;

  @Column('int', { default: 0 })
  @ApiProperty({ description: 'The current quantity in stock.', default: 0 })
  stock: number;

  @Column('int', { default: 10 })
  @ApiProperty({ description: 'The stock level at which a reorder should be triggered.', default: 10 })
  reorderLevel: number;

  @Column({ nullable: true })
  @ApiProperty({ description: 'The category of the product.', required: false })
  category: string;

  @Column({ nullable: true })
  @ApiProperty({ description: 'URL of the product image.', required: false })
  imageUrl: string;
  
  @CreateDateColumn()
  @ApiProperty({ description: 'The date and time the product was created.' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'The date and time the product was last updated.' })
  updatedAt: Date;
} 