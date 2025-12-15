import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendPushDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The FCM device registration token.' })
  deviceToken: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Delivery Update' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Your driver is 2 stops away!' })
  body: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, example: { orderId: '123-abc', route: '/orders/123-abc' } })
  data?: { [key: string]: string };
} 