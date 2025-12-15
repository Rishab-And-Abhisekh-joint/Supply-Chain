import { IsArray, IsNotEmpty, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class PickListItemDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The UUID of the product to pick.' })
  productId: string;

  @IsNotEmpty()
  @Min(1)
  @ApiProperty({ description: 'The quantity of the product to pick.', minimum: 1 })
  quantity: number;
}

export class CreatePickListDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The ID of the order this picklist is for.' })
  orderId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PickListItemDto)
  @ApiProperty({ type: [PickListItemDto] })
  items: PickListItemDto[];
} 