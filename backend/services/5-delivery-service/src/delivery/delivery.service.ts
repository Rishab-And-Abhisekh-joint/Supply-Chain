import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryRoute, RouteStatus } from './entities/delivery-route.entity';
import { RouteStop, StopStatus } from './entities/route-stop.entity';
import { CreateDeliveryRouteDto } from './dto/create-delivery-route.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { MappingService } from './integrations/mapping.service';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(DeliveryRoute)
    private readonly routeRepository: Repository<DeliveryRoute>,
    @InjectRepository(RouteStop)
    private readonly stopRepository: Repository<RouteStop>,
    private readonly mappingService: MappingService,
  ) {}

  async createRoute(createDto: CreateDeliveryRouteDto): Promise<DeliveryRoute> {
    const route = this.routeRepository.create({
      driverId: createDto.driverId,
      routeDate: createDto.routeDate,
      status: RouteStatus.PLANNED,
      stops: createDto.stops.map((stopDto, index) => ({
        orderId: stopDto.orderId,
        deliveryAddress: stopDto.deliveryAddress,
        plannedSequence: index + 1,
        status: StopStatus.PENDING,
      })),
    });
    return this.routeRepository.save(route);
  }

  async createOptimizedRoute(createDto: CreateDeliveryRouteDto): Promise<DeliveryRoute> {
    const addresses = createDto.stops.map(s => s.deliveryAddress);
    const optimizedOrder = await this.mappingService.getOptimizedRoute(addresses);

    const orderedStops = optimizedOrder.map((originalIndex, newIndex) => {
        const stopDto = createDto.stops[originalIndex];
        return {
            ...stopDto,
            plannedSequence: newIndex + 1,
            status: StopStatus.PENDING,
        };
    });

    const route = this.routeRepository.create({
      driverId: createDto.driverId,
      routeDate: createDto.routeDate,
      status: RouteStatus.PLANNED,
      stops: orderedStops,
    });

    return this.routeRepository.save(route);
  }

  findAllRoutes(): Promise<DeliveryRoute[]> {
    return this.routeRepository.find({ relations: ['stops'], order: { routeDate: 'DESC' } });
  }

  async findRouteById(id: string): Promise<DeliveryRoute> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['stops'],
      order: { stops: { plannedSequence: 'ASC' } },
    });
    if (!route) {
      throw new NotFoundException(`Delivery Route with ID "${id}" not found.`);
    }
    return route;
  }

  async updateStopStatus(stopId: string, updateDto: UpdateStopStatusDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOneBy({ id: stopId });
    if (!stop) {
      throw new NotFoundException(`Route Stop with ID "${stopId}" not found.`);
    }

    stop.status = updateDto.status;
    stop.actualDeliveryTime = updateDto.status === StopStatus.DELIVERED ? new Date() : null;
    
    // Here you could trigger events to notify Order Service or customers
    // e.g., this.messagingService.publish('stop.completed', { orderId: stop.orderId });

    const savedStop = await this.stopRepository.save(stop);
    
    // Check if all stops are completed to update the main route status
    this.checkAndUpdateRouteStatus(savedStop.routeId);

    return savedStop;
  }

  private async checkAndUpdateRouteStatus(routeId: string) {
    const route = await this.routeRepository.findOne({
        where: { id: routeId },
        relations: ['stops'],
    });

    const allStopsCompleted = route.stops.every(s => s.status === StopStatus.DELIVERED || s.status === StopStatus.FAILED);
    
    if (allStopsCompleted && route.status !== RouteStatus.COMPLETED) {
        route.status = RouteStatus.COMPLETED;
        await this.routeRepository.save(route);
    }
  }
} 