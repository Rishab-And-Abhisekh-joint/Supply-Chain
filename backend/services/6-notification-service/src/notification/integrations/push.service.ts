import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface PushOptions {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  badge?: number;
  sound?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkPushResult {
  successCount: number;
  failureCount: number;
  results: PushResult[];
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly fcmServerKey: string;

  constructor(private configService: ConfigService) {
    this.fcmServerKey = this.configService.get<string>('FCM_SERVER_KEY', '');
  }

  /**
   * Flexible send method - accepts various message formats
   */
  async send(message: any): Promise<PushResult> {
    try {
      // Extract token from various possible locations
      const token = message.token || message.deviceToken || message.to;
      
      // Extract notification content
      const notification = message.notification || {};
      const title = notification.title || message.title || 'Notification';
      const body = notification.body || message.body || message.message || '';
      
      // Extract data payload
      const data = message.data || {};

      if (!token) {
        // Check for multiple tokens
        const tokens = message.tokens || [];
        if (tokens.length > 0) {
          return this.sendToMultiple(tokens, title, body, data);
        }
        
        this.logger.warn('No token provided for push notification');
        return {
          success: false,
          error: 'No token provided',
        };
      }

      return this.sendPush({
        token,
        title,
        body,
        data,
      });
    } catch (error) {
      this.logger.error(`Failed to send push: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendToMultiple(tokens: string[], title: string, body: string, data: any): Promise<PushResult> {
    let successCount = 0;
    
    for (const token of tokens) {
      const result = await this.sendPush({ token, title, body, data });
      if (result.success) successCount++;
    }

    return {
      success: successCount > 0,
      messageId: `bulk-${Date.now()}`,
    };
  }

  async sendPush(options: PushOptions): Promise<PushResult> {
    try {
      // Check if FCM is configured
      if (!this.fcmServerKey) {
        this.logger.warn('FCM not configured, simulating push notification');
        return this.simulatePushSend(options);
      }

      return await this.sendViaFcm(options);
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async sendViaFcm(options: PushOptions): Promise<PushResult> {
    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${this.fcmServerKey}`,
        },
        body: JSON.stringify({
          to: options.token,
          notification: {
            title: options.title,
            body: options.body,
            image: options.imageUrl,
            sound: options.sound || 'default',
            badge: options.badge,
            click_action: options.actionUrl,
          },
          data: options.data,
        }),
      });

      const result = await response.json();

      if (result.success === 1) {
        this.logger.log(`Push notification sent, message_id: ${result.results?.[0]?.message_id}`);
        return {
          success: true,
          messageId: result.results?.[0]?.message_id,
        };
      } else {
        throw new Error(result.results?.[0]?.error || 'Unknown FCM error');
      }
    } catch (error) {
      this.logger.error(`FCM error: ${error.message}`);
      throw error;
    }
  }

  private simulatePushSend(options: PushOptions): PushResult {
    const tokenPreview = options.token ? options.token.substring(0, 20) : 'unknown';
    this.logger.log(`[SIMULATED] Push to token: ${tokenPreview}..., Title: ${options.title}`);
    return {
      success: true,
      messageId: `sim-push-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async sendOrderUpdate(token: string, orderNumber: string, status: string): Promise<PushResult> {
    const titles: Record<string, string> = {
      CONFIRMED: 'Order Confirmed! 🎉',
      PROCESSING: 'Order Processing',
      SHIPPED: 'Order Shipped! 📦',
      OUT_FOR_DELIVERY: 'Out for Delivery! 🚚',
      DELIVERED: 'Order Delivered! ✅',
      CANCELLED: 'Order Cancelled',
    };

    const bodies: Record<string, string> = {
      CONFIRMED: `Your order ${orderNumber} has been confirmed.`,
      PROCESSING: `Your order ${orderNumber} is being processed.`,
      SHIPPED: `Your order ${orderNumber} is on its way!`,
      OUT_FOR_DELIVERY: `Your order ${orderNumber} will arrive today!`,
      DELIVERED: `Your order ${orderNumber} has been delivered.`,
      CANCELLED: `Your order ${orderNumber} has been cancelled.`,
    };

    return this.sendPush({
      token,
      title: titles[status] || 'Order Update',
      body: bodies[status] || `Order ${orderNumber}: ${status}`,
      data: {
        type: 'ORDER_UPDATE',
        orderNumber,
        status,
      },
    });
  }

  async sendDeliveryAlert(token: string, orderNumber: string, estimatedTime: string): Promise<PushResult> {
    return this.sendPush({
      token,
      title: 'Delivery Coming Soon! 🚚',
      body: `Your order ${orderNumber} will arrive at ${estimatedTime}`,
      data: {
        type: 'DELIVERY_ALERT',
        orderNumber,
        estimatedTime,
      },
    });
  }

  async sendInventoryAlert(token: string, productName: string, currentStock: number): Promise<PushResult> {
    return this.sendPush({
      token,
      title: '⚠️ Low Inventory Alert',
      body: `${productName} is running low (${currentStock} units remaining)`,
      data: {
        type: 'INVENTORY_ALERT',
        productName,
        currentStock,
      },
    });
  }
}