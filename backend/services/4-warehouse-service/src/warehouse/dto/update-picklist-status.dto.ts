import { IsEnum, IsNotEmpty } from 'class-validator';
import { PickListStatus } from '../entities/picklist.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePickListStatusDto {
  @IsEnum(PickListStatus)
  @IsNotEmpty()
  @ApiProperty({ enum: PickListStatus, description: 'The new status of the picklist.' })
  status: PickListStatus;
} 