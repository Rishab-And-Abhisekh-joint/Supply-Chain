// =============================================================================
// FILE: src/inventory/dto/release-stock.dto.ts
// ACTION: CREATE NEW
// =============================================================================

import { IsUUID, IsOptional, IsString } from 'class-validator';

export class ReleaseStockDto {
  @IsUUID()
  reservationId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
