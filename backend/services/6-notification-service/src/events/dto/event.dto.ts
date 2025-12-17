import { IsString, IsNotEmpty, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Unusual delivery delay detected in Zone A' })
  message: string;

  @IsEnum(EventType)
  @ApiProperty({ enum: EventType, example: EventType.SUSPICIOUS })
  type: EventType;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'delivery-service' })
  source?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ example: 'delivery_issue' })
  category?: string;

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ example: { orderId: '123', driverId: 'DRV-001' } })
  metadata?: Record<string, any>;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: EventType })
  type: EventType;

  @ApiPropertyOptional()
  source?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  timestamp: Date;
}

export class EventStreamResponseDto {
  @ApiProperty({ type: [EventResponseDto] })
  events: EventResponseDto[];
}