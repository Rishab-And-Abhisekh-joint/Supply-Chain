import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  IsDate,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReceivingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum QualityCheckStatus {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

export enum ItemCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  DEFECTIVE = 'DEFECTIVE',
}

// ============ CREATE RECEIVING ITEM DTO ============
export class CreateReceivingItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsString()
  @IsOptional()
  productSku?: string;

  @ApiPropertyOptional({ description: 'Product name' })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiProperty({ description: 'Expected quantity' })
  @IsNumber()
  @Min(1)
  expectedQuantity: number;

  @ApiPropertyOptional({ description: 'Received quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  receivedQuantity?: number;

  @ApiPropertyOptional({ description: 'Unit weight of the item' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  unitWeight?: number;

  @ApiPropertyOptional({ description: 'Weight unit (kg, lb, oz, g)', default: 'kg' })
  @IsString()
  @IsOptional()
  weightUnit?: string;

  @ApiPropertyOptional({ description: 'Unit of measure' })
  @IsString()
  @IsOptional()
  unitOfMeasure?: string;

  @ApiPropertyOptional({ description: 'Batch/Lot number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expirationDate?: Date;

  @ApiPropertyOptional({ description: 'Serial numbers array' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serialNumbers?: string[];

  @ApiPropertyOptional({ description: 'Target location in warehouse' })
  @IsString()
  @IsOptional()
  targetLocation?: string;

  @ApiPropertyOptional({ description: 'Notes for this item' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ CREATE RECEIVING DTO ============
export class CreateReceivingDto {
  @ApiPropertyOptional({ description: 'Purchase order ID' })
  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Purchase order number' })
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Supplier name' })
  @IsString()
  @IsOptional()
  supplierName?: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Warehouse name' })
  @IsString()
  @IsOptional()
  warehouseName?: string;

  @ApiPropertyOptional({ description: 'Expected arrival date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expectedDate?: Date;

  @ApiPropertyOptional({ description: 'Carrier/shipping company' })
  @IsString()
  @IsOptional()
  carrier?: string;

  @ApiPropertyOptional({ description: 'Tracking number' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Bill of lading number' })
  @IsString()
  @IsOptional()
  billOfLading?: string;

  @ApiPropertyOptional({ description: 'Total weight of shipment' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalWeight?: number;

  @ApiPropertyOptional({ description: 'Weight unit (kg, lb)', default: 'kg' })
  @IsString()
  @IsOptional()
  weightUnit?: string;

  @ApiPropertyOptional({ description: 'Number of pallets' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  palletCount?: number;

  @ApiPropertyOptional({ description: 'Number of cartons/boxes' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  cartonCount?: number;

  @ApiPropertyOptional({ description: 'Dock door assignment' })
  @IsString()
  @IsOptional()
  dockDoor?: string;

  @ApiPropertyOptional({ description: 'General notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Items to receive', type: [CreateReceivingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReceivingItemDto)
  @IsOptional()
  items?: CreateReceivingItemDto[];
}

// ============ UPDATE RECEIVING STATUS DTO ============
export class UpdateReceivingStatusDto {
  @ApiProperty({ enum: ReceivingStatus, description: 'New status' })
  @IsEnum(ReceivingStatus)
  status: ReceivingStatus;

  @ApiPropertyOptional({ description: 'User ID who received the shipment' })
  @IsUUID()
  @IsOptional()
  receivedBy?: string;

  @ApiPropertyOptional({ description: 'Notes about the status change' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ PROCESS RECEIVING ITEM DTO ============
export class ProcessReceivingItemDto {
  @ApiProperty({ description: 'Actual quantity received' })
  @IsNumber()
  @Min(0)
  receivedQuantity: number;

  @ApiPropertyOptional({ enum: ItemCondition, description: 'Condition of items' })
  @IsEnum(ItemCondition)
  @IsOptional()
  condition?: ItemCondition;

  @ApiPropertyOptional({ description: 'Damaged quantity' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  damagedQuantity?: number;

  @ApiPropertyOptional({ description: 'Batch/Lot number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expirationDate?: Date;

  @ApiPropertyOptional({ description: 'Serial numbers for serialized items' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  serialNumbers?: string[];

  @ApiPropertyOptional({ description: 'Storage location assigned' })
  @IsString()
  @IsOptional()
  storageLocation?: string;

  @ApiPropertyOptional({ description: 'Notes about this item' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============ QUALITY CHECK DTO ============
export class QualityCheckDto {
  @ApiProperty({ enum: QualityCheckStatus, description: 'Quality check result' })
  @IsEnum(QualityCheckStatus)
  qualityStatus: QualityCheckStatus;

  @ApiPropertyOptional({ description: 'User ID who performed the check' })
  @IsUUID()
  @IsOptional()
  checkedBy?: string;

  @ApiPropertyOptional({ description: 'Quality score (0-100)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  qualityScore?: number;

  @ApiPropertyOptional({ description: 'Items that passed inspection' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  passedQuantity?: number;

  @ApiPropertyOptional({ description: 'Items that failed inspection' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  failedQuantity?: number;

  @ApiPropertyOptional({ description: 'Discrepancy notes' })
  @IsString()
  @IsOptional()
  discrepancyNotes?: string;

  @ApiPropertyOptional({ description: 'Quality check notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Photo URLs of quality issues' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photoUrls?: string[];
}

// ============ RECEIVING FILTER DTO ============
export class ReceivingFilterDto {
  @ApiPropertyOptional({ enum: ReceivingStatus, description: 'Filter by status' })
  @IsEnum(ReceivingStatus)
  @IsOptional()
  status?: ReceivingStatus;

  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsUUID()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Filter by purchase order ID' })
  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Search term (receiving number, PO number, supplier)' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}

// ============ RECEIVING STATS DTO ============
export class ReceivingStatsDto {
  @ApiProperty()
  totalReceivings: number;

  @ApiProperty()
  pendingReceivings: number;

  @ApiProperty()
  inProgressReceivings: number;

  @ApiProperty()
  completedReceivings: number;

  @ApiProperty()
  receivingsToday: number;

  @ApiProperty()
  itemsReceivedToday: number;

  @ApiProperty()
  avgProcessingTimeMinutes: number;

  @ApiProperty()
  qualityPassRate: number;

  @ApiProperty({ type: 'object' })
  byStatus: Record<string, number>;

  @ApiProperty({ type: 'object' })
  byWarehouse: Record<string, number>;
}

// ============ PAGINATED RESPONSE DTO ============
export class PaginatedReceivingsDto {
  @ApiProperty({ type: [Object] })
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