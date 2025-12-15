import { IsArray, IsNotEmpty, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ReceivingItemDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The UUID of the product being received.' })
  productId: string;

  @IsNotEmpty()
  @Min(1)
  @ApiProperty({ description: 'The quantity of the product being received.', minimum: 1 })
  quantity: number;
}

export class CreateReceivingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivingItemDto)
  @ApiProperty({ type: [ReceivingItemDto] })
  items: ReceivingItemDto[];
} 