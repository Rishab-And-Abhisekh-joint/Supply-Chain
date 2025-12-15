import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { PickListItem } from './picklist-item.entity';

export enum PickListStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('picklists')
export class PickList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  orderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({
    type: 'enum',
    enum: PickListStatus,
    default: PickListStatus.PENDING,
  })
  status: PickListStatus;

  @OneToMany(() => PickListItem, (item) => item.pickList, { cascade: true })
  items: PickListItem[];
} 