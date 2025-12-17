import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  import { NotificationType, NotificationCategory } from './notification.entity';
  
  @Entity('notification_templates')
  @Index(['code'], { unique: true })
  @Index(['type', 'isActive'])
  export class NotificationTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 100, unique: true })
    code: string;
  
    @Column({ type: 'varchar', length: 255 })
    name: string;
  
    @Column({ type: 'text', nullable: true })
    description: string;
  
    @Column({
      type: 'enum',
      enum: NotificationType,
      default: NotificationType.EMAIL,
    })
    type: NotificationType;
  
    @Column({
      type: 'enum',
      enum: NotificationCategory,
      default: NotificationCategory.SYSTEM,
    })
    category: NotificationCategory;
  
    // Email specific
    @Column({ type: 'varchar', length: 255, nullable: true })
    subject: string;
  
    @Column({ type: 'text', nullable: true })
    textContent: string;
  
    @Column({ type: 'text', nullable: true })
    htmlContent: string;
  
    // SMS specific
    @Column({ type: 'text', nullable: true })
    smsContent: string;
  
    // Push notification specific
    @Column({ type: 'varchar', length: 100, nullable: true })
    pushTitle: string;
  
    @Column({ type: 'text', nullable: true })
    pushBody: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    pushIcon: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    pushImage: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    pushActionUrl: string;
  
    // Template variables
    @Column({ type: 'simple-array', nullable: true })
    requiredVariables: string[];
  
    @Column({ type: 'jsonb', nullable: true })
    defaultValues: Record<string, any>;
  
    @Column({ type: 'jsonb', nullable: true })
    sampleData: Record<string, any>;
  
    // Sender info
    @Column({ type: 'varchar', length: 255, nullable: true })
    fromEmail: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    fromName: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    replyTo: string;
  
    // Status
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
  
    @Column({ type: 'boolean', default: false })
    isSystem: boolean;
  
    // Versioning
    @Column({ type: 'int', default: 1 })
    version: number;
  
    @Column({ type: 'uuid', nullable: true })
    previousVersionId: string;
  
    // Localization
    @Column({ type: 'varchar', length: 10, default: 'en' })
    locale: string;
  
    @Column({ type: 'jsonb', nullable: true })
    translations: Record<string, any>;
  
    // Audit
    @Column({ type: 'uuid', nullable: true })
    createdBy: string;
  
    @Column({ type: 'uuid', nullable: true })
    updatedBy: string;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }