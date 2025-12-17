import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SmsOptions {
  to: string;
  message: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioAccountSid: string;
  private readonly twilioAuthToken: string;
  private readonly twilioPhoneNumber: string;

  constructor(private configService: ConfigService) {
    this.twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID', '');
    this.twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN', '');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER', '');
  }

  /**
   * Simple send method for compatibility
   */
  async send(to: string, message: string): Promise<SmsResult> {
    return this.sendSms({ to, message });
  }

  async sendSms(options: SmsOptions): Promise<SmsResult> {
    try {
      // Check if Twilio is configured
      if (!this.twilioAccountSid || !this.twilioAuthToken) {
        this.logger.warn('Twilio not configured, simulating SMS send');
        return this.simulateSmsSend(options);
      }

      return await this.sendViaTwilio(options);
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendViaTwilio(options: SmsOptions): Promise<SmsResult> {
    try {
      const twilio = require('twilio');
      const client = twilio(this.twilioAccountSid, this.twilioAuthToken);

      const message = await client.messages.create({
        body: options.message,
        from: options.from || this.twilioPhoneNumber,
        to: options.to,
      });

      this.logger.log(`SMS sent to ${options.to}, SID: ${message.sid}`);

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      this.logger.error(`Twilio error: ${error.message}`);
      throw error;
    }
  }

  private simulateSmsSend(options: SmsOptions): SmsResult {
    this.logger.log(`[SIMULATED] SMS to: ${options.to}, Message: ${options.message.substring(0, 50)}...`);
    return {
      success: true,
      messageId: `sim-sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async sendOrderConfirmation(to: string, orderNumber: string): Promise<SmsResult> {
    return this.sendSms({
      to,
      message: `Your order ${orderNumber} has been confirmed! We'll notify you when it ships. Reply STOP to unsubscribe.`,
    });
  }

  async sendDeliveryUpdate(to: string, orderNumber: string, status: string): Promise<SmsResult> {
    const statusMessages: Record<string, string> = {
      SHIPPED: `Your order ${orderNumber} has been shipped and is on its way!`,
      OUT_FOR_DELIVERY: `Your order ${orderNumber} is out for delivery today!`,
      DELIVERED: `Your order ${orderNumber} has been delivered. Thank you for your order!`,
      DELAYED: `Your order ${orderNumber} has been delayed. We apologize for the inconvenience.`,
    };

    const message = statusMessages[status] || `Order ${orderNumber} update: ${status}`;

    return this.sendSms({
      to,
      message: `${message} Reply STOP to unsubscribe.`,
    });
  }

  async sendOtp(to: string, otp: string): Promise<SmsResult> {
    return this.sendSms({
      to,
      message: `Your verification code is: ${otp}. This code expires in 10 minutes. Do not share this code with anyone.`,
    });
  }

  async sendInventoryAlert(to: string, productName: string, currentStock: number): Promise<SmsResult> {
    return this.sendSms({
      to,
      message: `ALERT: Low inventory for ${productName}. Current stock: ${currentStock} units. Please reorder soon.`,
    });
  }
}