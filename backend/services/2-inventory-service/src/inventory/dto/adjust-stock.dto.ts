import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustStockDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty({ 
    example: -10, 
    description: 'The quantity to adjust the stock by. Can be positive (add stock) or negative (remove stock).' 
  })
  quantity: number;
} 