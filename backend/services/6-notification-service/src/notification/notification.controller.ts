import { Controller, Post, Body } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendPushDto } from './dto/send-push.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('email')
  @ApiOperation({ summary: 'Send an email' })
  @ApiResponse({ status: 201, description: 'Email sent successfully.' })
  sendEmail(@Body() sendEmailDto: SendEmailDto) {
    return this.notificationService.sendEmail(sendEmailDto);
  }

  @Post('sms')
  @ApiOperation({ summary: 'Send an SMS' })
  @ApiResponse({ status: 201, description: 'SMS sent successfully.' })
  sendSms(@Body() sendSmsDto: SendSmsDto) {
    return this.notificationService.sendSms(sendSmsDto);
  }

  @Post('push')
  @ApiOperation({ summary: 'Send a push notification' })
  @ApiResponse({ status: 201, description: 'Push notification sent successfully.' })
  sendPushNotification(@Body() sendPushDto: SendPushDto) {
    return this.notificationService.sendPushNotification(sendPushDto);
  }
} 