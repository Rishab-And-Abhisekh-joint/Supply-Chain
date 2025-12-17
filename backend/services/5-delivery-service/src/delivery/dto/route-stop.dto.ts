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
    Max,
    MaxLength,
    Min,
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import {
    StopStatus,
    StopType,
    FailureReason,
    DeliveryLocation,
  } from '../entities/route-stop.entity';
  
  export class UpdateStopStatusDto {
    @IsEnum(StopStatus)
    @IsNotEmpty()
    @ApiProperty({ enum: StopStatus })
    status: StopStatus;
  
    @IsEnum(FailureReason)
    @IsOptional()
    @ApiPropertyOptional({ enum: FailureReason })
    failureReason?: FailureReason;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Failure notes' })
    failureNotes?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Driver notes' })
    driverNotes?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current longitude' })
    longitude?: number;
  }
  
  export class CompleteDeliveryDto {
    @IsEnum(DeliveryLocation)
    @IsNotEmpty()
    @ApiProperty({ enum: DeliveryLocation })
    deliveryLocation: DeliveryLocation;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Recipient name' })
    recipientName?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Relation to customer' })
    relationToCustomer?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Signature URL (base64 or URL)' })
    signatureUrl?: string;
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Photo URLs', type: [String] })
    photoUrls?: string[];
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'COD collected', default: false })
    codCollected?: boolean;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'COD amount collected' })
    codAmountCollected?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Driver notes' })
    driverNotes?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current longitude' })
    longitude?: number;
  }
  
  export class FailDeliveryDto {
    @IsEnum(FailureReason)
    @IsNotEmpty()
    @ApiProperty({ enum: FailureReason })
    failureReason: FailureReason;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Failure notes' })
    failureNotes?: string;
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Photo URLs documenting failure', type: [String] })
    photoUrls?: string[];
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Schedule reattempt', default: false })
    scheduleReattempt?: boolean;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Next attempt date' })
    nextAttemptDate?: Date;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Driver notes' })
    driverNotes?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current longitude' })
    longitude?: number;
  }
  
  export class RescheduleStopDto {
    @IsDateString()
    @IsNotEmpty()
    @ApiProperty({ description: 'New delivery date/time' })
    newDateTime: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'New time window start' })
    timeWindowStart?: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'New time window end' })
    timeWindowEnd?: Date;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Reschedule reason' })
    reason?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  export class UpdateStopSequenceDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ApiProperty({ description: 'Ordered array of stop IDs', type: [String] })
    stopIds: string[];
  }
  
  export class ArriveAtStopDto {
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Arrival latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Arrival longitude' })
    longitude?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  export class CustomerRatingDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    @IsNotEmpty()
    @ApiProperty({ description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
    rating: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Customer feedback' })
    feedback?: string;
  }
  
  export class StopFilterDto {
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Route ID' })
    routeId?: string;
  
    @IsEnum(StopStatus)
    @IsOptional()
    @ApiPropertyOptional({ enum: StopStatus })
    status?: StopStatus;
  
    @IsEnum(StopType)
    @IsOptional()
    @ApiPropertyOptional({ enum: StopType })
    stopType?: StopType;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Order ID' })
    orderId?: string;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Customer ID' })
    customerId?: string;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Is urgent' })
    isUrgent?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Cash on delivery' })
    isCashOnDelivery?: boolean;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Start date' })
    startDate?: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'End date' })
    endDate?: Date;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Search term' })
    search?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    page?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    limit?: number;
  }
  
  export class StopStatsDto {
    @ApiProperty()
    totalStops: number;
  
    @ApiProperty()
    byStatus: Record<string, number>;
  
    @ApiProperty()
    byType: Record<string, number>;
  
    @ApiProperty()
    deliveredToday: number;
  
    @ApiProperty()
    failedToday: number;
  
    @ApiProperty()
    pendingToday: number;
  
    @ApiProperty()
    onTimeRate: number;
  
    @ApiProperty()
    averageServiceTime: number;
  
    @ApiProperty()
    codCollected: number;
  
    @ApiProperty()
    averageRating: number;
  }
  
  export class BulkUpdateStopsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ApiProperty({ description: 'Stop IDs to update', type: [String] })
    stopIds: string[];
  
    @IsEnum(StopStatus)
    @IsNotEmpty()
    @ApiProperty({ enum: StopStatus })
    status: StopStatus;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  export class TransferStopsDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @ApiProperty({ description: 'Stop IDs to transfer', type: [String] })
    stopIds: string[];
  
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ description: 'Target route ID' })
    targetRouteId: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Reason for transfer' })
    reason?: string;
  }
  
  export class PaginatedStopsDto {
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