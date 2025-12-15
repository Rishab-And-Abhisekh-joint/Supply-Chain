import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { PickList } from './picklist.entity';

@Entity('picklist_items')
export class PickListItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PickList, (pickList) => pickList.items)
  pickList: PickList;

  @Column('uuid')
  productId: string;

  @Column('int')
  quantity: number;

  @Column()
  location: string; // e.g., 'Aisle 5, Shelf B'
} 