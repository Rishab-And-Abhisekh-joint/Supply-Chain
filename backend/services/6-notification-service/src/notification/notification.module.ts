import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './integrations/email.service';
import { SmsService } from './integrations/sms.service';
import { PushService } from './integrations/push.service';
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      NotificationPreference,
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    EmailService,
    SmsService,
    PushService,
  ],
  exports: [
    NotificationService,
    EmailService,
    SmsService,
    PushService,
  ],
})
export class NotificationModule {}