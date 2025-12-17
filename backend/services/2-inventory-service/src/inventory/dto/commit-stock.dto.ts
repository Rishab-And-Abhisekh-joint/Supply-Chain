// =============================================================================
// FILE: src/inventory/dto/commit-stock.dto.ts
// ACTION: CREATE NEW
// =============================================================================

import { IsUUID, IsOptional, IsString } from 'class-validator';

export class CommitStockDto {
  @IsUUID()
  reservationId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
