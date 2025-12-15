import { Injectable } from '@nestjs/common';
import { EmailService } from './integrations/email.service';
import { SmsService } from './integrations/sms.service';
import { PushService } from './integrations/push.service';
import { SendEmailDto } from './dto/send-email.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendPushDto } from './dto/send-push.dto';
import { TokenMessage } from 'firebase-admin/messaging';

@Injectable()
export class NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly pushService: PushService,
  ) {}

  async sendEmail(dto: SendEmailDto): Promise<{ message: string }> {
    await this.emailService.send(dto.to, dto.subject, dto.body);
    return { message: 'Email sent successfully.' };
  }

  async sendSms(dto: SendSmsDto): Promise<{ message: string }> {
    await this.smsService.send(dto.to, dto.body);
    return { message: 'SMS sent successfully.' };
  }

  async sendPushNotification(dto: SendPushDto): Promise<{ message: string }> {
    const message: TokenMessage = {
      token: dto.deviceToken,
      notification: {
        title: dto.title,
        body: dto.body,
      },
      data: dto.data || {},
    };
    await this.pushService.send(message);
    return { message: 'Push notification sent successfully.' };
  }
} 