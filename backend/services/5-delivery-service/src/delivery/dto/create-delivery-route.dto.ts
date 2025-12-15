import { IsArray, IsDateString, IsNotEmpty, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class StopDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The UUID of the order for this stop.' })
  orderId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The full delivery address.' })
  deliveryAddress: string;
}

export class CreateDeliveryRouteDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The UUID of the assigned driver.' })
  driverId: string;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The date for which the route is planned.' })
  routeDate: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StopDto)
  @ApiProperty({ type: [StopDto] })
  stops: StopDto[];
} 