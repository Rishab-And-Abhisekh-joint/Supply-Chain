// =============================================================================
// FILE: src/inventory/dto/create-product.dto.ts
// ACTION: MODIFY - Add new fields
// =============================================================================

import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @Min(0)
  quantityInStock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderQuantity?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number;

  @IsNumber()
  @IsOptional()
  maxStockLevel?: number;

  @IsNumber()
  @IsOptional()
  weightKg?: number;

  @IsString()
  @IsOptional()
  dimensionsCm?: string;

  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}