import { IsEnum, IsNotEmpty } from 'class-validator';
import { StopStatus } from '../entities/route-stop.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStopStatusDto {
  @IsEnum(StopStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: StopStatus, description: 'The new status of the delivery stop.' })
  status: StopStatus;
} 