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
    MaxLength,
    Min,
    ValidateNested,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import {
    RouteStatus,
    RouteType,
    RoutePriority,
    VehicleType,
  } from '../entities/delivery-route.entity';
  import { StopType } from '../entities/route-stop.entity';
  
  export class CreateStopDto {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ description: 'Order ID for this stop' })
    orderId: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(50)
    @ApiPropertyOptional({ description: 'Order number' })
    orderNumber?: string;
  
    @IsEnum(StopType)
    @IsOptional()
    @ApiPropertyOptional({ enum: StopType, default: StopType.DELIVERY })
    stopType?: StopType;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Customer ID' })
    customerId?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Customer name' })
    customerName?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Customer phone' })
    customerPhone?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(255)
    @ApiPropertyOptional({ description: 'Customer email' })
    customerEmail?: string;
  
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Full delivery address' })
    deliveryAddress: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(255)
    @ApiPropertyOptional({ description: 'Address line 1' })
    addressLine1?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(255)
    @ApiPropertyOptional({ description: 'Address line 2' })
    addressLine2?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'City' })
    city?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'State/Province' })
    state?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Postal code' })
    postalCode?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Latitude coordinate' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Longitude coordinate' })
    longitude?: number;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Time window start' })
    timeWindowStart?: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Time window end' })
    timeWindowEnd?: Date;
  
    @IsNumber()
    @IsOptional()
    @Min(1)
    @ApiPropertyOptional({ description: 'Number of packages', default: 1 })
    packageCount?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Total weight in kg' })
    totalWeightKg?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Total volume in cubic meters' })
    totalVolumeM3?: number;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Requires signature', default: false })
    requiresSignature?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Requires ID verification', default: false })
    requiresIdVerification?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Is fragile', default: false })
    isFragile?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Cash on delivery', default: false })
    isCashOnDelivery?: boolean;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'COD amount' })
    codAmount?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Delivery instructions' })
    deliveryInstructions?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Access code for building/gate' })
    accessCode?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Priority (lower = higher priority)' })
    priority?: number;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Is urgent', default: false })
    isUrgent?: boolean;
  }
  
  export class CreateDeliveryRouteDto {
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Driver ID' })
    driverId?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Driver name' })
    driverName?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Driver phone' })
    driverPhone?: string;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Vehicle ID' })
    vehicleId?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Vehicle license plate' })
    vehiclePlate?: string;
  
    @IsEnum(VehicleType)
    @IsOptional()
    @ApiPropertyOptional({ enum: VehicleType, default: VehicleType.VAN })
    vehicleType?: VehicleType;
  
    @IsDateString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Route date' })
    routeDate: Date;
  
    @IsEnum(RouteType)
    @IsOptional()
    @ApiPropertyOptional({ enum: RouteType, default: RouteType.DELIVERY })
    routeType?: RouteType;
  
    @IsEnum(RoutePriority)
    @IsOptional()
    @ApiPropertyOptional({ enum: RoutePriority, default: RoutePriority.NORMAL })
    priority?: RoutePriority;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Warehouse ID' })
    warehouseId?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Warehouse name' })
    warehouseName?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(50)
    @ApiPropertyOptional({ description: 'Delivery zone' })
    zone?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Region' })
    region?: string;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Planned start time' })
    plannedStartTime?: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Planned end time' })
    plannedEndTime?: Date;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max weight capacity in kg' })
    maxWeightKg?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max volume capacity in cubic meters' })
    maxVolumeM3?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max packages' })
    maxPackages?: number;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Has fragile items' })
    hasFragileItems?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Requires signature' })
    requiresSignature?: boolean;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Driver instructions' })
    driverInstructions?: string;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateStopDto)
    @ApiProperty({ type: [CreateStopDto] })
    stops: CreateStopDto[];
  }
  
  export class UpdateRouteStatusDto {
    @IsEnum(RouteStatus)
    @IsNotEmpty()
    @ApiProperty({ enum: RouteStatus })
    status: RouteStatus;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Status change notes' })
    notes?: string;
  }
  
  export class AssignDriverDto {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ description: 'Driver ID' })
    driverId: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Driver name' })
    driverName?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Driver phone' })
    driverPhone?: string;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Vehicle ID' })
    vehicleId?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Vehicle plate' })
    vehiclePlate?: string;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Assigned by user ID' })
    assignedBy?: string;
  }
  
  export class StartRouteDto {
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Starting latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Starting longitude' })
    longitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current odometer reading in km' })
    odometerKm?: number;
  }
  
  export class UpdateLocationDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Current latitude' })
    latitude: number;
  
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Current longitude' })
    longitude: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Speed in km/h' })
    speedKmh?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Heading in degrees' })
    heading?: number;
  }
  
  export class RouteFilterDto {
    @IsEnum(RouteStatus)
    @IsOptional()
    @ApiPropertyOptional({ enum: RouteStatus })
    status?: RouteStatus;
  
    @IsEnum(RouteType)
    @IsOptional()
    @ApiPropertyOptional({ enum: RouteType })
    routeType?: RouteType;
  
    @IsEnum(RoutePriority)
    @IsOptional()
    @ApiPropertyOptional({ enum: RoutePriority })
    priority?: RoutePriority;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Driver ID' })
    driverId?: string;
  
    @IsUUID()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Warehouse ID' })
    warehouseId?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Zone' })
    zone?: string;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Route date' })
    routeDate?: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Start date for range filter' })
    startDate?: Date;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'End date for range filter' })
    endDate?: Date;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Search term' })
    search?: string;
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    page?: number;
  
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    limit?: number;
  }
  
  export class RouteStatsDto {
    @ApiProperty()
    totalRoutes: number;
  
    @ApiProperty()
    byStatus: Record<string, number>;
  
    @ApiProperty()
    byType: Record<string, number>;
  
    @ApiProperty()
    byPriority: Record<string, number>;
  
    @ApiProperty()
    totalStops: number;
  
    @ApiProperty()
    completedStops: number;
  
    @ApiProperty()
    failedStops: number;
  
    @ApiProperty()
    averageCompletionRate: number;
  
    @ApiProperty()
    totalDistanceKm: number;
  
    @ApiProperty()
    activeRoutes: number;
  
    @ApiProperty()
    onTimeDeliveryRate: number;
  }
  
  export class PaginatedRoutesDto {
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