import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsEmail,
    IsEnum,
    IsUUID,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    MaxLength,
    Min,
    Max,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  import {
    DriverStatus,
    DriverType,
    LicenseType,
  } from '../entities/driver.entity';
  
  export class CreateDriverDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    @ApiProperty({ description: 'Employee ID' })
    employeeId: string;
  
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @ApiProperty({ description: 'First name' })
    firstName: string;
  
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @ApiProperty({ description: 'Last name' })
    lastName: string;
  
    @IsEmail()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Email address' })
    email?: string;
  
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    @ApiProperty({ description: 'Phone number' })
    phone: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Emergency contact phone' })
    emergencyPhone?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Emergency contact name' })
    emergencyContact?: string;
  
    @IsEnum(DriverType)
    @IsOptional()
    @ApiPropertyOptional({ enum: DriverType, default: DriverType.FULL_TIME })
    driverType?: DriverType;
  
    @IsString()
    @IsOptional()
    @MaxLength(50)
    @ApiPropertyOptional({ description: 'License number' })
    licenseNumber?: string;
  
    @IsEnum(LicenseType)
    @IsOptional()
    @ApiPropertyOptional({ enum: LicenseType, default: LicenseType.STANDARD })
    licenseType?: LicenseType;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'License expiry date' })
    licenseExpiry?: Date;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'License issuing state' })
    licenseState?: string;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle hazmat', default: false })
    canHandleHazmat?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle refrigerated', default: false })
    canHandleRefrigerated?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle oversized', default: false })
    canHandleOversized?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle COD', default: true })
    canHandleCOD?: boolean;
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Certifications', type: [String] })
    certifications?: string[];
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Preferred zones', type: [String] })
    preferredZones?: string[];
  
    @IsNumber()
    @IsOptional()
    @Min(1)
    @Max(24)
    @ApiPropertyOptional({ description: 'Max hours per day', default: 8 })
    maxHoursPerDay?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max stops per day' })
    maxStopsPerDay?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max distance per day in km' })
    maxDistancePerDayKm?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Default shift start time (HH:MM)' })
    defaultShiftStart?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Default shift end time (HH:MM)' })
    defaultShiftEnd?: string;
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Work days', type: [String] })
    workDays?: string[];
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Home address' })
    homeAddress?: string;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Home latitude' })
    homeLatitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Home longitude' })
    homeLongitude?: number;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Hire date' })
    hireDate?: Date;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  export class UpdateDriverDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'First name' })
    firstName?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Last name' })
    lastName?: string;
  
    @IsEmail()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Email address' })
    email?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Phone number' })
    phone?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Emergency contact phone' })
    emergencyPhone?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Emergency contact name' })
    emergencyContact?: string;
  
    @IsEnum(DriverType)
    @IsOptional()
    @ApiPropertyOptional({ enum: DriverType })
    driverType?: DriverType;
  
    @IsString()
    @IsOptional()
    @MaxLength(50)
    @ApiPropertyOptional({ description: 'License number' })
    licenseNumber?: string;
  
    @IsEnum(LicenseType)
    @IsOptional()
    @ApiPropertyOptional({ enum: LicenseType })
    licenseType?: LicenseType;
  
    @IsDateString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'License expiry date' })
    licenseExpiry?: Date;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle hazmat' })
    canHandleHazmat?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle refrigerated' })
    canHandleRefrigerated?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Can handle oversized' })
    canHandleOversized?: boolean;
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Certifications', type: [String] })
    certifications?: string[];
  
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    @ApiPropertyOptional({ description: 'Preferred zones', type: [String] })
    preferredZones?: string[];
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max hours per day' })
    maxHoursPerDay?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Max stops per day' })
    maxStopsPerDay?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Default shift start time' })
    defaultShiftStart?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Default shift end time' })
    defaultShiftEnd?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Home address' })
    homeAddress?: string;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  
    @IsBoolean()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Is active' })
    isActive?: boolean;
  }
  
  export class UpdateDriverStatusDto {
    @IsEnum(DriverStatus)
    @IsNotEmpty()
    @ApiProperty({ enum: DriverStatus })
    status: DriverStatus;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Current longitude' })
    longitude?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  export class StartShiftDto {
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Start latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Start longitude' })
    longitude?: number;
  
    @IsString()
    @IsOptional()
    @MaxLength(100)
    @ApiPropertyOptional({ description: 'Device ID' })
    deviceId?: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(50)
    @ApiPropertyOptional({ description: 'App version' })
    appVersion?: string;
  }
  
  export class EndShiftDto {
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'End latitude' })
    latitude?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'End longitude' })
    longitude?: number;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  export class AssignVehicleDto {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ description: 'Vehicle ID' })
    vehicleId: string;
  
    @IsString()
    @IsOptional()
    @MaxLength(20)
    @ApiPropertyOptional({ description: 'Vehicle plate' })
    vehiclePlate?: string;
  }
  
  export class DriverFilterDto {
    @IsEnum(DriverStatus)
    @IsOptional()
    @ApiPropertyOptional({ enum: DriverStatus })
    status?: DriverStatus;
  
    @IsEnum(DriverType)
    @IsOptional()
    @ApiPropertyOptional({ enum: DriverType })
    driverType?: DriverType;
  
    @IsEnum(LicenseType)
    @IsOptional()
    @ApiPropertyOptional({ enum: LicenseType })
    licenseType?: LicenseType;
  
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    @ApiPropertyOptional({ description: 'Can handle hazmat' })
    canHandleHazmat?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    @ApiPropertyOptional({ description: 'Can handle refrigerated' })
    canHandleRefrigerated?: boolean;
  
    @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    @ApiPropertyOptional({ description: 'Is active' })
    isActive?: boolean;
  
    @IsString()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Zone' })
    zone?: string;
  
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
  
  export class DriverStatsDto {
    @ApiProperty()
    totalDrivers: number;
  
    @ApiProperty()
    byStatus: Record<string, number>;
  
    @ApiProperty()
    byType: Record<string, number>;
  
    @ApiProperty()
    availableDrivers: number;
  
    @ApiProperty()
    onRouteDrivers: number;
  
    @ApiProperty()
    averageRating: number;
  
    @ApiProperty()
    averageDeliveriesPerDriver: number;
  
    @ApiProperty()
    topPerformers: any[];
  }
  
  export class DriverLocationUpdateDto {
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Latitude' })
    latitude: number;
  
    @IsNumber()
    @IsNotEmpty()
    @ApiProperty({ description: 'Longitude' })
    longitude: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Speed in km/h' })
    speed?: number;
  
    @IsNumber()
    @IsOptional()
    @ApiPropertyOptional({ description: 'Battery level (0-100)' })
    batteryLevel?: number;
  }
  
  export class PaginatedDriversDto {
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