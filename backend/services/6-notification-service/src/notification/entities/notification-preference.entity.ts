import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  import { NotificationType, NotificationCategory } from './notification.entity';
  
  @Entity('notification_preferences')
  @Index(['userId'], { unique: true })
  export class NotificationPreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'uuid', unique: true })
    @Index()
    userId: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;
  
    @Column({ type: 'varchar', length: 20, nullable: true })
    phone: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    deviceToken: string;
  
    // Global preferences
    @Column({ type: 'boolean', default: true })
    emailEnabled: boolean;
  
    @Column({ type: 'boolean', default: true })
    smsEnabled: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushEnabled: boolean;
  
    @Column({ type: 'boolean', default: true })
    inAppEnabled: boolean;
  
    // Category preferences - Email
    @Column({ type: 'boolean', default: true })
    emailOrders: boolean;
  
    @Column({ type: 'boolean', default: true })
    emailDelivery: boolean;
  
    @Column({ type: 'boolean', default: true })
    emailInventory: boolean;
  
    @Column({ type: 'boolean', default: true })
    emailPayment: boolean;
  
    @Column({ type: 'boolean', default: true })
    emailPromotions: boolean;
  
    @Column({ type: 'boolean', default: true })
    emailAlerts: boolean;
  
    @Column({ type: 'boolean', default: true })
    emailSystem: boolean;
  
    // Category preferences - SMS
    @Column({ type: 'boolean', default: true })
    smsOrders: boolean;
  
    @Column({ type: 'boolean', default: true })
    smsDelivery: boolean;
  
    @Column({ type: 'boolean', default: false })
    smsInventory: boolean;
  
    @Column({ type: 'boolean', default: true })
    smsPayment: boolean;
  
    @Column({ type: 'boolean', default: false })
    smsPromotions: boolean;
  
    @Column({ type: 'boolean', default: true })
    smsAlerts: boolean;
  
    @Column({ type: 'boolean', default: false })
    smsSystem: boolean;
  
    // Category preferences - Push
    @Column({ type: 'boolean', default: true })
    pushOrders: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushDelivery: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushInventory: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushPayment: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushPromotions: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushAlerts: boolean;
  
    @Column({ type: 'boolean', default: true })
    pushSystem: boolean;
  
    // Quiet hours
    @Column({ type: 'boolean', default: false })
    quietHoursEnabled: boolean;
  
    @Column({ type: 'time', nullable: true })
    quietHoursStart: string;
  
    @Column({ type: 'time', nullable: true })
    quietHoursEnd: string;
  
    @Column({ type: 'varchar', length: 50, default: 'UTC' })
    timezone: string;
  
    // Frequency limits
    @Column({ type: 'int', nullable: true })
    maxEmailsPerDay: number;
  
    @Column({ type: 'int', nullable: true })
    maxSmsPerDay: number;
  
    @Column({ type: 'int', nullable: true })
    maxPushPerDay: number;
  
    // Digest preferences
    @Column({ type: 'boolean', default: false })
    digestEnabled: boolean;
  
    @Column({ type: 'varchar', length: 20, default: 'DAILY' })
    digestFrequency: string;
  
    @Column({ type: 'time', nullable: true })
    digestTime: string;
  
    // Language preference
    @Column({ type: 'varchar', length: 10, default: 'en' })
    locale: string;
  
    // Unsubscribe tracking
    @Column({ type: 'boolean', default: false })
    unsubscribedAll: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    unsubscribedAt: Date;
  
    @Column({ type: 'text', nullable: true })
    unsubscribeReason: string;
  
    // Advanced settings stored as JSON
    @Column({ type: 'jsonb', nullable: true })
    advancedSettings: Record<string, any>;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }