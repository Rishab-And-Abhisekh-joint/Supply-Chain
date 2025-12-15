import { IsString, IsNotEmpty, IsNumber, IsInt, Min, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'SKU-001', description: 'Unique Stock Keeping Unit' })
  sku: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Wireless Mouse', description: 'Product name' })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'A high-precision ergonomic wireless mouse.' })
  description?: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 49.99, description: 'Product price' })
  price: number;

  @IsInt()
  @Min(0)
  @ApiProperty({ example: 100, description: 'Initial stock quantity' })
  stock: number;
  
  @IsInt()
  @Min(0)
  @IsOptional()
  @ApiProperty({ required: false, example: 20, description: 'Reorder level' })
  reorderLevel?: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, example: 'Electronics' })
  category?: string;

  @IsUrl()
  @IsOptional()
  @ApiProperty({ required: false, example: 'http://example.com/image.png' })
  imageUrl?: string;
} 