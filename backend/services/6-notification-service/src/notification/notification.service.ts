import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from './entities/notification.entity';
import { EmailService } from './integrations/email.service';
import { SmsService } from './integrations/sms.service';
import { PushService } from './integrations/push.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private emailService: EmailService,
    private smsService: SmsService,
    private pushService: PushService,
  ) {}

  async sendEmail(to: string, subject: string, body: string): Promise<any> {
    this.logger.log(`Sending email to ${to}`);
    
    // Create notification record
    const notification = this.notificationRepository.create({
      notificationNumber: `NTF-${Date.now()}`,
      type: NotificationType.EMAIL,
      status: NotificationStatus.PENDING,
      recipientEmail: to,
      subject,
      content: body,
    });
    
    await this.notificationRepository.save(notification);
    
    // Send via email service
    const result = await this.emailService.send(to, subject, body);
    
    // Update status
    notification.status = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
    notification.sentAt = result.success ? new Date() : null;
    notification.lastError = result.error || null;
    await this.notificationRepository.save(notification);
    
    return result;
  }

  async sendSms(to: string, message: string): Promise<any> {
    this.logger.log(`Sending SMS to ${to}`);
    
    const notification = this.notificationRepository.create({
      notificationNumber: `NTF-${Date.now()}`,
      type: NotificationType.SMS,
      status: NotificationStatus.PENDING,
      recipientPhone: to,
      subject: 'SMS',
      content: message,
    });
    
    await this.notificationRepository.save(notification);
    
    const result = await this.smsService.send(to, message);
    
    notification.status = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
    notification.sentAt = result.success ? new Date() : null;
    notification.lastError = result.error || null;
    await this.notificationRepository.save(notification);
    
    return result;
  }

  async sendPush(token: string, title: string, body: string, data?: any): Promise<any> {
    this.logger.log(`Sending push notification`);
    
    const notification = this.notificationRepository.create({
      notificationNumber: `NTF-${Date.now()}`,
      type: NotificationType.PUSH,
      status: NotificationStatus.PENDING,
      deviceToken: token,
      subject: title,
      content: body,
    });
    
    await this.notificationRepository.save(notification);
    
    const result = await this.pushService.send({ token, title, body, data });
    
    notification.status = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;
    notification.sentAt = result.success ? new Date() : null;
    notification.lastError = result.error || null;
    await this.notificationRepository.save(notification);
    
    return result;
  }

  async findAll(page = 1, limit = 10): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.notificationRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Notification> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string, page = 1, limit = 10): Promise<{ data: Notification[]; total: number }> {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    if (notification) {
      notification.isRead = true;
      notification.readAt = new Date();
      return this.notificationRepository.save(notification);
    }
    return null;
  }

  async getStats(): Promise<any> {
    const total = await this.notificationRepository.count();
    const sent = await this.notificationRepository.count({ where: { status: NotificationStatus.SENT } });
    const failed = await this.notificationRepository.count({ where: { status: NotificationStatus.FAILED } });
    const pending = await this.notificationRepository.count({ where: { status: NotificationStatus.PENDING } });
    
    return { total, sent, failed, pending };
  }
}