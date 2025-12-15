import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { DeliveryRoute } from './delivery-route.entity';

export enum StopStatus {
  PENDING = 'PENDING',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED', // e.g., customer not home
}

@Entity('route_stops')
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => DeliveryRoute, (route) => route.stops)
  route: DeliveryRoute;
  
  @Column('uuid') // Foreign key to the route
  routeId: string;

  @Column('uuid')
  orderId: string;

  @Column('text')
  deliveryAddress: string;

  @Column('int')
  plannedSequence: number;

  @Column({ type: 'timestamp', nullable: true })
  estimatedDeliveryTime: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  actualDeliveryTime: Date | null;

  @Column({
    type: 'enum',
    enum: StopStatus,
    default: StopStatus.PENDING,
  })
  status: StopStatus;
} 