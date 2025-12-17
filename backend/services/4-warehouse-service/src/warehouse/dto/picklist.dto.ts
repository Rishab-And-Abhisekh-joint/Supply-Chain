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
  PickListStatus,
  PickListPriority,
  PickListType,
} from '../entities/picklist.entity';
import { PickListItemStatus } from '../entities/picklist-item.entity';

// Create PickList Item DTO
export class CreatePickListItemDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The UUID of the product to pick' })
  productId: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Quantity required', minimum: 1 })
  quantity: number;

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
  @ApiPropertyOptional({ description: 'Pick location' })
  location?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Lot number' })
  lotNumber?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Unit weight' })
  unitWeight?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Weight unit' })
  weightUnit?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Unit price' })
  unitPrice?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Requires serial scan' })
  requiresSerialScan?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Requires lot tracking' })
  requiresLotTracking?: boolean;
}

// Create PickList DTO
export class CreatePickListDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the order' })
  orderId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Order number' })
  orderNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePickListItemDto)
  @ApiProperty({ type: [CreatePickListItemDto] })
  items: CreatePickListItemDto[];

  @IsOptional()
  @IsEnum(PickListPriority)
  @ApiPropertyOptional({ enum: PickListPriority })
  priority?: PickListPriority;

  @IsOptional()
  @IsEnum(PickListType)
  @ApiPropertyOptional({ enum: PickListType })
  type?: PickListType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Warehouse ID' })
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Zone' })
  zone?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Customer name' })
  customerName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Shipping method' })
  shippingMethod?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Expected ship date' })
  expectedShipDate?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is rush order' })
  isRush?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Requires verification' })
  requiresVerification?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Special instructions' })
  specialInstructions?: string;
}

// Update PickList Status DTO
export class UpdatePickListStatusDto {
  @IsEnum(PickListStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: PickListStatus, description: 'New status' })
  status: PickListStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes for status change' })
  notes?: string;
}

// Assign PickList DTO
export class AssignPickListDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Worker ID or name to assign' })
  assignedTo: string;
}

// Update PickList Item DTO
export class UpdatePickListItemDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Quantity picked' })
  quantityPicked?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Quantity short' })
  quantityShort?: number;

  @IsOptional()
  @IsEnum(PickListItemStatus)
  @ApiPropertyOptional({ enum: PickListItemStatus })
  status?: PickListItemStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Serial number' })
  serialNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Lot number' })
  lotNumber?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Picked by' })
  pickedBy?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Substitute product ID' })
  substituteProductId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Substitute reason' })
  substituteReason?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

// Verify PickList DTO
export class VerifyPickListDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Verified by' })
  verifiedBy: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Verification notes' })
  notes?: string;
}

// PickList Filter DTO
export class PickListFilterDto {
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
  @IsEnum(PickListStatus)
  @ApiPropertyOptional({ enum: PickListStatus })
  status?: PickListStatus;

  @IsOptional()
  @IsEnum(PickListPriority)
  @ApiPropertyOptional({ enum: PickListPriority })
  priority?: PickListPriority;

  @IsOptional()
  @IsEnum(PickListType)
  @ApiPropertyOptional({ enum: PickListType })
  type?: PickListType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Assigned worker' })
  assignedTo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Warehouse ID' })
  warehouseId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Zone' })
  zone?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Is rush' })
  isRush?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Start date filter' })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'End date filter' })
  endDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search by picklist number, order number, or customer name' })
  search?: string;
}

// Response DTOs
export class PickListStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  pending: number;

  @ApiProperty()
  assigned: number;

  @ApiProperty()
  inProgress: number;

  @ApiProperty()
  completed: number;

  @ApiProperty()
  completedToday: number;

  @ApiProperty()
  rushOrders: number;

  @ApiProperty()
  averageCompletionTime: number;
}

export class PaginatedPickListsDto {
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
