import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('SENDGRID_API_KEY', '');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@example.com');
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'Supply Chain Platform');
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // Check if SendGrid is configured
      if (!this.apiKey || !this.apiKey.startsWith('SG.')) {
        this.logger.warn('SendGrid API key not configured, simulating email send');
        return this.simulateEmailSend(options);
      }

      // In production, use SendGrid
      const response = await this.sendViaSendGrid(options);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendViaSendGrid(options: EmailOptions): Promise<EmailResult> {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      const msg = {
        to: options.to,
        from: {
          email: options.from || this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      };

      const [response] = await sgMail.send(msg);
      
      this.logger.log(`Email sent to ${options.to}, status: ${response.statusCode}`);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'],
      };
    } catch (error) {
      this.logger.error(`SendGrid error: ${error.message}`);
      throw error;
    }
  }

  private simulateEmailSend(options: EmailOptions): EmailResult {
    this.logger.log(`[SIMULATED] Email to: ${options.to}, Subject: ${options.subject}`);
    return {
      success: true,
      messageId: `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async sendOrderConfirmation(to: string, orderNumber: string, orderDetails: any): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: `Order Confirmation - ${orderNumber}`,
      html: this.generateOrderConfirmationHtml(orderNumber, orderDetails),
      text: `Your order ${orderNumber} has been confirmed.`,
    });
  }

  async sendDeliveryNotification(to: string, orderNumber: string, status: string): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: `Delivery Update - ${orderNumber}`,
      html: this.generateDeliveryUpdateHtml(orderNumber, status),
      text: `Delivery update for order ${orderNumber}: ${status}`,
    });
  }

  async sendInventoryAlert(to: string, productName: string, currentStock: number, threshold: number): Promise<EmailResult> {
    return this.sendEmail({
      to,
      subject: `Low Inventory Alert - ${productName}`,
      html: this.generateInventoryAlertHtml(productName, currentStock, threshold),
      text: `Low inventory alert: ${productName} is at ${currentStock} units (threshold: ${threshold})`,
    });
  }

  private generateOrderConfirmationHtml(orderNumber: string, details: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Thank you for your order!</p>
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p>We'll notify you when your order ships.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Supply Chain Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateDeliveryUpdateHtml(orderNumber: string, status: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status { font-size: 18px; font-weight: bold; color: #10B981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Delivery Update</h1>
          </div>
          <div class="content">
            <p><strong>Order Number:</strong> ${orderNumber}</p>
            <p class="status">Status: ${status}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateInventoryAlertHtml(productName: string, currentStock: number, threshold: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert { color: #EF4444; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Inventory Alert</h1>
          </div>
          <div class="content">
            <p><strong>Product:</strong> ${productName}</p>
            <p class="alert">Current Stock: ${currentStock} units</p>
            <p>Threshold: ${threshold} units</p>
            <p>Please reorder soon to avoid stockouts.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}