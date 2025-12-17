// =============================================================================
// FILE: src/inventory/dto/reserve-stock.dto.ts
// ACTION: CREATE NEW
// =============================================================================

import { IsUUID, IsInt, IsPositive, IsOptional, IsString, IsDateString } from 'class-validator';

export class ReserveStockDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsUUID()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  reservedBy?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
