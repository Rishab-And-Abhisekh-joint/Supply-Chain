import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  export enum NotificationType {
    EMAIL = 'EMAIL',
    SMS = 'SMS',
    PUSH = 'PUSH',
    IN_APP = 'IN_APP',
    WEBHOOK = 'WEBHOOK',
  }
  
  export enum NotificationStatus {
    PENDING = 'PENDING',
    QUEUED = 'QUEUED',
    SENDING = 'SENDING',
    SENT = 'SENT',
    DELIVERED = 'DELIVERED',
    FAILED = 'FAILED',
    BOUNCED = 'BOUNCED',
    CANCELLED = 'CANCELLED',
  }
  
  export enum NotificationPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
  }
  
  export enum NotificationCategory {
    ORDER = 'ORDER',
    DELIVERY = 'DELIVERY',
    INVENTORY = 'INVENTORY',
    WAREHOUSE = 'WAREHOUSE',
    PAYMENT = 'PAYMENT',
    PROMOTION = 'PROMOTION',
    ALERT = 'ALERT',
    SYSTEM = 'SYSTEM',
    REMINDER = 'REMINDER',
  }
  
  @Entity('notifications')
  @Index(['status', 'createdAt'])
  @Index(['userId', 'createdAt'])
  @Index(['type', 'status'])
  export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 50, unique: true })
    notificationNumber: string;
  
    @Column({
      type: 'enum',
      enum: NotificationType,
      default: NotificationType.EMAIL,
    })
    @Index()
    type: NotificationType;
  
    @Column({
      type: 'enum',
      enum: NotificationStatus,
      default: NotificationStatus.PENDING,
    })
    @Index()
    status: NotificationStatus;
  
    @Column({
      type: 'enum',
      enum: NotificationPriority,
      default: NotificationPriority.NORMAL,
    })
    priority: NotificationPriority;
  
    @Column({
      type: 'enum',
      enum: NotificationCategory,
      default: NotificationCategory.SYSTEM,
    })
    @Index()
    category: NotificationCategory;
  
    // Recipient info
    @Column({ type: 'uuid', nullable: true })
    @Index()
    userId: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    recipientEmail: string;
  
    @Column({ type: 'varchar', length: 20, nullable: true })
    recipientPhone: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    recipientName: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    deviceToken: string;
  
    // Content
    @Column({ type: 'varchar', length: 255 })
    subject: string;
  
    @Column({ type: 'text' })
    content: string;
  
    @Column({ type: 'text', nullable: true })
    htmlContent: string;
  
    @Column({ type: 'jsonb', nullable: true })
    templateData: Record<string, any>;
  
    @Column({ type: 'uuid', nullable: true })
    templateId: string;
  
    // Related entities
    @Column({ type: 'uuid', nullable: true })
    @Index()
    orderId: string;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    orderNumber: string;
  
    @Column({ type: 'uuid', nullable: true })
    deliveryId: string;
  
    @Column({ type: 'uuid', nullable: true })
    warehouseId: string;
  
    // Sending details
    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    sentAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    deliveredAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    readAt: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    failedAt: Date;
  
    // Provider info
    @Column({ type: 'varchar', length: 50, nullable: true })
    provider: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    providerMessageId: string;
  
    @Column({ type: 'text', nullable: true })
    providerResponse: string;
  
    // Retry handling
    @Column({ type: 'int', default: 0 })
    attemptCount: number;
  
    @Column({ type: 'int', default: 3 })
    maxAttempts: number;
  
    @Column({ type: 'timestamp', nullable: true })
    nextRetryAt: Date;
  
    @Column({ type: 'text', nullable: true })
    lastError: string;
  
    // Tracking
    @Column({ type: 'boolean', default: false })
    isRead: boolean;
  
    @Column({ type: 'boolean', default: false })
    isClicked: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    clickedAt: Date;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    clickedUrl: string;
  
    // Metadata
    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @Column({ type: 'uuid', nullable: true })
    createdBy: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }