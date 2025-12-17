import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Patch,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

class SendEmailDto {
  to: string;
  subject: string;
  body: string;
}

class SendSmsDto {
  to: string;
  message: string;
}

class SendPushDto {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('email')
  @ApiOperation({ summary: 'Send email notification' })
  @ApiResponse({ status: 201, description: 'Email sent successfully' })
  async sendEmail(@Body() dto: SendEmailDto) {
    return this.notificationService.sendEmail(dto.to, dto.subject, dto.body);
  }

  @Post('sms')
  @ApiOperation({ summary: 'Send SMS notification' })
  @ApiResponse({ status: 201, description: 'SMS sent successfully' })
  async sendSms(@Body() dto: SendSmsDto) {
    return this.notificationService.sendSms(dto.to, dto.message);
  }

  @Post('push')
  @ApiOperation({ summary: 'Send push notification' })
  @ApiResponse({ status: 201, description: 'Push notification sent successfully' })
  async sendPush(@Body() dto: SendPushDto) {
    return this.notificationService.sendPush(dto.token, dto.title, dto.body, dto.data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.notificationService.findAll(+page, +limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  async getStats() {
    return this.notificationService.getStats();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get notifications for a user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findByUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.notificationService.findByUserId(userId, +page, +limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.markAsRead(id);
  }
}