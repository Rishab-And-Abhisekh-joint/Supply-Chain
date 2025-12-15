import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');
    const msg = {
      to: to,
      from: fromEmail,
      subject: subject,
      html: body, // Use `text` for plain text emails
    };

    try {
      await SendGrid.send(msg);
      console.log(`Email successfully sent to ${to}`);
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      if (error.response) {
        console.error(error.response.body);
      }
      throw new Error('Failed to send email.');
    }
  }
} 