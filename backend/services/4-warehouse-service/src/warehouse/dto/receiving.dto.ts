import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReceivingStatus,
  ReceivingType,
} from '../entities/receiving-record.entity';
import {
  ReceivingItemStatus,
  ReceivingItemCondition,
} from '../entities/receiving-item.entity';

// Create Receiving Item DTO
export class CreateReceivingItemDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'Product ID' })
  productId: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Expected quantity', minimum: 1 })
  quantityExpected: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product SKU' })
  productSku?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Product name' })
  productName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Lot number' })
  lotNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Batch number' })
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expiration date' })
  expirationDate?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Unit cost' })
  unitCost?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Requires inspection' })
  requiresInspection?: boolean;
}

// Create Receiving DTO
export class CreateReceivingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceivingItemDto)
  @ApiProperty({ type: [CreateReceivingItemDto] })
  items: CreateReceivingItemDto[];

  @IsOptional()
  @IsEnum(ReceivingType)
  @ApiPropertyOptional({ enum: ReceivingType })
  type?: ReceivingType;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Purchase order ID' })
  purchaseOrderId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Purchase order number' })
  purchaseOrderNumber?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Supplier ID' })
  supplierId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Supplier name' })
  supplierName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Warehouse ID' })
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Receiving dock' })
  receivingDock?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expected date' })
  expectedDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Carrier name' })
  carrierName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Tracking number' })
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Bill of lading' })
  billOfLading?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Pallet count' })
  palletCount?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Carton count' })
  cartonCount?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Requires quality check' })
  requiresQualityCheck?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

// Update Receiving Status DTO
export class UpdateReceivingStatusDto {
  @IsEnum(ReceivingStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: ReceivingStatus })
  status: ReceivingStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

// Process Receiving Item DTO
export class ProcessReceivingItemDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Quantity received' })
  quantityReceived: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Quantity rejected' })
  quantityRejected?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Quantity damaged' })
  quantityDamaged?: number;

  @IsOptional()
  @IsEnum(ReceivingItemCondition)
  @ApiPropertyOptional({ enum: ReceivingItemCondition })
  condition?: ReceivingItemCondition;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Location code' })
  locationCode?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Lot number' })
  lotNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Serial number' })
  serialNumber?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expiration date' })
  expirationDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Received by' })
  receivedBy?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is quarantined' })
  isQuarantined?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

// Quality Check DTO
export class QualityCheckDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Quality check by' })
  qualityCheckBy: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Passed quality check' })
  passed?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Quality check notes' })
  notes?: string;
}

// Receiving Filter DTO
export class ReceivingFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 20 })
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ReceivingStatus)
  @ApiPropertyOptional({ enum: ReceivingStatus })
  status?: ReceivingStatus;

  @IsOptional()
  @IsEnum(ReceivingType)
  @ApiPropertyOptional({ enum: ReceivingType })
  type?: ReceivingType;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Supplier ID' })
  supplierId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Warehouse ID' })
  warehouseId?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Has discrepancy' })
  hasDiscrepancy?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expected after' })
  expectedAfter?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expected before' })
  expectedBefore?: string;
}

// Response DTOs
export class ReceivingStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  scheduled: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  pendingQC: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  withDiscrepancy: number;

  @ApiProperty()
  completedToday: number;

  @ApiProperty()
  totalItemsReceived: number;
}

export class PaginatedReceivingsDto {
  @ApiProperty()
  data: any[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
