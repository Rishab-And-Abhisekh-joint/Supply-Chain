import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @IsEmail()
  @ApiProperty({ example: 'customer@example.com' })
  to: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Your Order has Shipped!' })
  subject: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: '<h1>Order Shipped</h1><p>Your order #123 is on its way.</p>' })
  body: string;
} 