import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LocationType,
  LocationStatus,
} from '../entities/warehouse-location.entity';

// Create Location DTO
export class CreateLocationDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Unique location code (e.g., A-05-B-03)' })
  locationCode: string;

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
  @ApiPropertyOptional({ description: 'Aisle' })
  aisle?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Rack' })
  rack?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Shelf' })
  shelf?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Bin' })
  bin?: string;

  @IsOptional()
  @IsEnum(LocationType)
  @ApiPropertyOptional({ enum: LocationType })
  type?: LocationType;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Max weight capacity' })
  maxWeight?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Weight unit' })
  weightUnit?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Max volume capacity' })
  maxVolume?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Volume unit' })
  volumeUnit?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Length' })
  length?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Width' })
  width?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Height' })
  height?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Dimension unit' })
  dimensionUnit?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is temperature controlled' })
  isTemperatureControlled?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Min temperature' })
  minTemperature?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Max temperature' })
  maxTemperature?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Temperature unit' })
  temperatureUnit?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is hazardous storage' })
  isHazardous?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is high value storage' })
  isHighValue?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Pick priority (lower = pick first)' })
  pickPriority?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

// Update Location DTO
export class UpdateLocationDto {
  @IsOptional()
  @IsEnum(LocationStatus)
  @ApiPropertyOptional({ enum: LocationStatus })
  status?: LocationStatus;

  @IsOptional()
  @IsEnum(LocationType)
  @ApiPropertyOptional({ enum: LocationType })
  type?: LocationType;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Current weight' })
  currentWeight?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Current volume' })
  currentVolume?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Current item count' })
  currentItemCount?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Max weight capacity' })
  maxWeight?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Max volume capacity' })
  maxVolume?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is temperature controlled' })
  isTemperatureControlled?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Min temperature' })
  minTemperature?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Max temperature' })
  maxTemperature?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is hazardous storage' })
  isHazardous?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Is high value storage' })
  isHighValue?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Pick priority' })
  pickPriority?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;
}

// Location Filter DTO
export class LocationFilterDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional({ default: 50 })
  limit?: number = 50;

  @IsOptional()
  @IsEnum(LocationType)
  @ApiPropertyOptional({ enum: LocationType })
  type?: LocationType;

  @IsOptional()
  @IsEnum(LocationStatus)
  @ApiPropertyOptional({ enum: LocationStatus })
  status?: LocationStatus;

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
  @ApiPropertyOptional({ description: 'Aisle' })
  aisle?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Is temperature controlled' })
  isTemperatureControlled?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Is hazardous' })
  isHazardous?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Has available space' })
  hasAvailableSpace?: boolean;
}

// Response DTOs
export class LocationStatsDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  active: number;

  @ApiProperty()
  full: number;

  @ApiProperty()
  maintenance: number;

  @ApiProperty()
  byType: Record<string, number>;

  @ApiProperty()
  utilizationPercentage: number;

  @ApiProperty()
  temperatureControlled: number;

  @ApiProperty()
  hazardous: number;
}

export class PaginatedLocationsDto {
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
