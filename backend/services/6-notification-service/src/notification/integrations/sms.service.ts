import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async send(to: string, body: string): Promise<void> {
    const fromPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');
    try {
      await this.twilioClient.messages.create({
        body: body,
        from: fromPhoneNumber,
        to: to, // Must be in E.164 format, e.g., +14155238886
      });
      console.log(`SMS successfully sent to ${to}`);
    } catch (error) {
      console.error('Error sending SMS via Twilio:', error);
      throw new Error('Failed to send SMS.');
    }
  }
} 