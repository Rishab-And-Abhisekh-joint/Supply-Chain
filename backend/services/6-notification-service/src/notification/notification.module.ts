import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './integrations/email.service';
import { SmsService } from './integrations/sms.service';
import { PushService } from './integrations/push.service';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, SmsService, PushService],
})
export class NotificationModule {} 