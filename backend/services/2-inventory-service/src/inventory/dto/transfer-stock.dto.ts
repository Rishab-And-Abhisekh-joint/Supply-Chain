// =============================================================================
// FILE: src/inventory/dto/transfer-stock.dto.ts
// ACTION: CREATE NEW
// =============================================================================

import { IsUUID, IsInt, IsPositive, IsOptional, IsString } from 'class-validator';

export class TransferStockDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  fromLocationId: string;

  @IsUUID()
  toLocationId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsString()
  @IsOptional()
  reason?: string;
}