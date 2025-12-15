import { IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendSmsDto {
  @IsPhoneNumber() // Validates E.164 format
  @ApiProperty({ example: '+15551234567' })
  to: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Your package will be delivered today.' })
  body: string;
} 