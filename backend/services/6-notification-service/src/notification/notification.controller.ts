// ============================================================================
// ADDITIONAL SERVICES - REQUIRED IMPLEMENTATIONS
// Based on frontend API expectations from lib/api.ts and hooks/use-api.ts
// ============================================================================

// =============================================================================
// 1. NOTIFICATION SERVICE ENHANCEMENTS
// FILE: 6-notification-service/src/notification/notification.controller.ts
// Frontend expects: /api/notifications, /api/notifications/{id}/read, /api/notifications/read-all
// =============================================================================

import { 
  Controller, Get, Post, Patch, Param, Body, Query,
  ParseUUIDPipe, HttpCode, HttpStatus, Headers
} from '@nestjs/common';

// ---------- DTOs ----------

export class CreateNotificationDto {
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  actionUrl?: string;
}

export class NotificationResponse {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// ---------- Entity ----------

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info' 
  })
  type: 'info' | 'warning' | 'error' | 'success';

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ name: 'action_url', nullable: true })
  actionUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;
}

// ---------- Service ----------

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Get all notifications for a user
   * Frontend: GET /api/notifications
   */
  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 notifications
    });
  }

  /**
   * Create a new notification
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(dto);
    return this.notificationRepository.save(notification);
  }

  /**
   * Mark single notification as read
   * Frontend: PATCH /api/notifications/{id}/read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read for a user
   * Frontend: POST /api/notifications/read-all
   */
  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );
    return { updated: result.affected || 0 };
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :cutoffDate', { cutoffDate })
      .andWhere('read = :read', { read: true })
      .execute();

    return result.affected || 0;
  }
}

// ---------- Controller ----------

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /notification
   * Frontend: notificationsApi.getAll()
   */
  @Get()
  async findAll(@Headers('x-user-id') userId: string): Promise<NotificationResponse[]> {
    const notifications = await this.notificationService.findByUser(userId);
    return notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      actionUrl: n.actionUrl,
    }));
  }

  /**
   * PATCH /notification/:id/read
   * Frontend: notificationsApi.markAsRead(id)
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-user-id') userId: string
  ): Promise<NotificationResponse> {
    const notification = await this.notificationService.markAsRead(id, userId);
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
      actionUrl: notification.actionUrl,
    };
  }

  /**
   * POST /notification/read-all
   * Frontend: notificationsApi.markAllAsRead()
   */
  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(
    @Headers('x-user-id') userId: string
  ): Promise<{ updated: number }> {
    return this.notificationService.markAllAsRead(userId);
  }
}


