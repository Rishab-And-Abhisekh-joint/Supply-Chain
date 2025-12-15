import { IsArray, IsNotEmpty, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CreateOrderItemDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'The UUID of the product to order.' })
  productId: string;

  @IsNotEmpty()
  @Min(1)
  @ApiProperty({ description: 'The quantity of the product to order.', minimum: 1 })
  quantity: number;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The shipping address for the order.' })
  shippingAddress: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @ApiProperty({ type: [CreateOrderItemDto] })
  items: CreateOrderItemDto[];
} 