import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { DeliveryRoute, RouteStatus } from './entities/delivery-route.entity';
import { RouteStop, StopStatus, FailureReason } from './entities/route-stop.entity';
import { Driver, DriverStatus } from './entities/driver.entity';
import { Vehicle, VehicleStatus } from './entities/vehicle.entity';

import {
  CreateDeliveryRouteDto,
  UpdateRouteStatusDto,
  AssignDriverDto,
  StartRouteDto,
  UpdateLocationDto,
  RouteFilterDto,
  RouteStatsDto,
  PaginatedRoutesDto,
} from './dto/delivery-route.dto';

import {
  UpdateStopStatusDto,
  CompleteDeliveryDto,
  FailDeliveryDto,
  RescheduleStopDto,
  UpdateStopSequenceDto,
  ArriveAtStopDto,
  CustomerRatingDto,
  StopFilterDto,
  StopStatsDto,
  TransferStopsDto,
} from './dto/route-stop.dto';

import {
  CreateDriverDto,
  UpdateDriverDto,
  UpdateDriverStatusDto,
  StartShiftDto,
  EndShiftDto,
  AssignVehicleDto,
  DriverFilterDto,
  DriverStatsDto,
  DriverLocationUpdateDto,
} from './dto/driver.dto';

@Injectable()
export class DeliveryService {
  private readonly orderServiceUrl: string;
  private readonly notificationServiceUrl: string;

  constructor(
    @InjectRepository(DeliveryRoute)
    private readonly routeRepository: Repository<DeliveryRoute>,
    @InjectRepository(RouteStop)
    private readonly stopRepository: Repository<RouteStop>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL') || 'http://localhost:3002';
    this.notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:3006';
  }

  // ==================== ROUTE METHODS ====================

  async createRoute(dto: CreateDeliveryRouteDto): Promise<DeliveryRoute> {
    const routeNumber = this.generateRouteNumber();

    const stops = dto.stops.map((stopDto, index) => ({
      ...stopDto,
      plannedSequence: index + 1,
      status: StopStatus.PENDING,
      attemptNumber: 1,
    }));

    // Calculate totals
    const totalWeight = stops.reduce((sum, s) => sum + (s.totalWeightKg || 0), 0);
    const totalVolume = stops.reduce((sum, s) => sum + (s.totalVolumeM3 || 0), 0);
    const totalPackages = stops.reduce((sum, s) => sum + (s.packageCount || 1), 0);

    const route = this.routeRepository.create({
      ...dto,
      routeNumber,
      status: dto.driverId ? RouteStatus.ASSIGNED : RouteStatus.DRAFT,
      totalStops: stops.length,
      currentWeightKg: totalWeight,
      currentVolumeM3: totalVolume,
      currentPackages: totalPackages,
      hasFragileItems: stops.some(s => s.isFragile),
      requiresSignature: stops.some(s => s.requiresSignature),
      assignedAt: dto.driverId ? new Date() : null,
      stops,
    });

    const savedRoute = await this.routeRepository.save(route);

    // Notify order service about route assignment
    this.notifyOrdersAssignedToRoute(savedRoute);

    return savedRoute;
  }

  async createOptimizedRoute(dto: CreateDeliveryRouteDto): Promise<DeliveryRoute> {
    // In a real implementation, call a mapping/routing API to optimize stop order
    const optimizedStops = this.optimizeStopOrder(dto.stops);
    dto.stops = optimizedStops;

    const route = await this.createRoute(dto);
    route.isOptimized = true;
    route.optimizedAt = new Date();
    route.optimizationAlgorithm = 'NEAREST_NEIGHBOR';

    return this.routeRepository.save(route);
  }

  async findAllRoutes(filter: RouteFilterDto): Promise<PaginatedRoutesDto> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.routeRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.stops', 'stops')
      .orderBy('route.routeDate', 'DESC')
      .addOrderBy('route.createdAt', 'DESC');

    if (filter.status) {
      queryBuilder.andWhere('route.status = :status', { status: filter.status });
    }

    if (filter.routeType) {
      queryBuilder.andWhere('route.routeType = :routeType', { routeType: filter.routeType });
    }

    if (filter.priority) {
      queryBuilder.andWhere('route.priority = :priority', { priority: filter.priority });
    }

    if (filter.driverId) {
      queryBuilder.andWhere('route.driverId = :driverId', { driverId: filter.driverId });
    }

    if (filter.warehouseId) {
      queryBuilder.andWhere('route.warehouseId = :warehouseId', { warehouseId: filter.warehouseId });
    }

    if (filter.zone) {
      queryBuilder.andWhere('route.zone = :zone', { zone: filter.zone });
    }

    if (filter.routeDate) {
      queryBuilder.andWhere('route.routeDate = :routeDate', { routeDate: filter.routeDate });
    }

    if (filter.startDate && filter.endDate) {
      queryBuilder.andWhere('route.routeDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    if (filter.search) {
      queryBuilder.andWhere(
        '(route.routeNumber ILIKE :search OR route.driverName ILIKE :search OR route.zone ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRouteById(id: string): Promise<DeliveryRoute> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['stops'],
      order: { stops: { plannedSequence: 'ASC' } },
    });

    if (!route) {
      throw new NotFoundException(`Route with ID "${id}" not found`);
    }

    return route;
  }

  async findRouteByNumber(routeNumber: string): Promise<DeliveryRoute> {
    const route = await this.routeRepository.findOne({
      where: { routeNumber },
      relations: ['stops'],
    });

    if (!route) {
      throw new NotFoundException(`Route with number "${routeNumber}" not found`);
    }

    return route;
  }

  async findRoutesByDriver(driverId: string): Promise<DeliveryRoute[]> {
    return this.routeRepository.find({
      where: { driverId },
      relations: ['stops'],
      order: { routeDate: 'DESC' },
    });
  }

  async updateRouteStatus(id: string, dto: UpdateRouteStatusDto): Promise<DeliveryRoute> {
    const route = await this.findRouteById(id);

    this.validateRouteStatusTransition(route.status, dto.status);

    route.status = dto.status;

    if (dto.status === RouteStatus.IN_PROGRESS && !route.actualStartTime) {
      route.actualStartTime = new Date();
    }

    if (dto.status === RouteStatus.COMPLETED || dto.status === RouteStatus.PARTIALLY_COMPLETED) {
      route.actualEndTime = new Date();
      if (route.actualStartTime) {
        route.actualDurationMinutes = Math.round(
          (route.actualEndTime.getTime() - route.actualStartTime.getTime()) / 60000,
        );
      }
    }

    if (dto.notes) {
      route.notes = dto.notes;
    }

    const savedRoute = await this.routeRepository.save(route);

    // Update driver status if route completed
    if (dto.status === RouteStatus.COMPLETED && route.driverId) {
      await this.updateDriverStatus(route.driverId, { status: DriverStatus.AVAILABLE });
    }

    return savedRoute;
  }

  async assignDriver(id: string, dto: AssignDriverDto): Promise<DeliveryRoute> {
    const route = await this.findRouteById(id);

    if (route.status !== RouteStatus.DRAFT && route.status !== RouteStatus.PLANNED) {
      throw new BadRequestException('Can only assign driver to draft or planned routes');
    }

    // Verify driver exists and is available
    const driver = await this.driverRepository.findOneBy({ id: dto.driverId });
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${dto.driverId}" not found`);
    }

    if (driver.status !== DriverStatus.AVAILABLE && driver.status !== DriverStatus.OFF_DUTY) {
      throw new BadRequestException('Driver is not available for assignment');
    }

    route.driverId = dto.driverId;
    route.driverName = dto.driverName || `${driver.firstName} ${driver.lastName}`;
    route.driverPhone = dto.driverPhone || driver.phone;
    route.vehicleId = dto.vehicleId;
    route.vehiclePlate = dto.vehiclePlate;
    route.assignedBy = dto.assignedBy;
    route.assignedAt = new Date();
    route.status = RouteStatus.ASSIGNED;

    // Update driver status
    driver.status = DriverStatus.ON_ROUTE;
    await this.driverRepository.save(driver);

    // Update vehicle if assigned
    if (dto.vehicleId) {
      await this.vehicleRepository.update(dto.vehicleId, {
        status: VehicleStatus.IN_USE,
        assignedDriverId: dto.driverId,
        currentRouteId: route.id,
      });
    }

    return this.routeRepository.save(route);
  }

  async startRoute(id: string, dto: StartRouteDto): Promise<DeliveryRoute> {
    const route = await this.findRouteById(id);

    if (route.status !== RouteStatus.ASSIGNED) {
      throw new BadRequestException('Can only start assigned routes');
    }

    route.status = RouteStatus.IN_PROGRESS;
    route.actualStartTime = new Date();

    if (dto.latitude && dto.longitude) {
      route.currentLatitude = dto.latitude;
      route.currentLongitude = dto.longitude;
      route.lastLocationUpdate = new Date();
    }

    // Set first stop to EN_ROUTE
    const firstStop = route.stops.find(s => s.plannedSequence === 1);
    if (firstStop) {
      firstStop.status = StopStatus.EN_ROUTE;
      await this.stopRepository.save(firstStop);
    }

    return this.routeRepository.save(route);
  }

  async updateRouteLocation(id: string, dto: UpdateLocationDto): Promise<DeliveryRoute> {
    const route = await this.findRouteById(id);

    route.currentLatitude = dto.latitude;
    route.currentLongitude = dto.longitude;
    route.lastLocationUpdate = new Date();

    return this.routeRepository.save(route);
  }

  async getRouteStats(filter?: RouteFilterDto): Promise<RouteStatsDto> {
    const queryBuilder = this.routeRepository.createQueryBuilder('route');

    if (filter?.startDate && filter?.endDate) {
      queryBuilder.andWhere('route.routeDate BETWEEN :startDate AND :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    if (filter?.warehouseId) {
      queryBuilder.andWhere('route.warehouseId = :warehouseId', { warehouseId: filter.warehouseId });
    }

    const routes = await queryBuilder.getMany();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    let totalStops = 0;
    let completedStops = 0;
    let failedStops = 0;
    let totalDistanceKm = 0;
    let activeRoutes = 0;
    let onTimeCount = 0;
    let totalCompleted = 0;

    for (const route of routes) {
      byStatus[route.status] = (byStatus[route.status] || 0) + 1;
      byType[route.routeType] = (byType[route.routeType] || 0) + 1;
      byPriority[route.priority] = (byPriority[route.priority] || 0) + 1;

      totalStops += route.totalStops;
      completedStops += route.completedStops;
      failedStops += route.failedStops;
      totalDistanceKm += route.actualDistanceKm || 0;

      if (route.status === RouteStatus.IN_PROGRESS) {
        activeRoutes++;
      }

      if (route.status === RouteStatus.COMPLETED) {
        totalCompleted++;
        if (route.actualEndTime && route.plannedEndTime && route.actualEndTime <= route.plannedEndTime) {
          onTimeCount++;
        }
      }
    }

    return {
      totalRoutes: routes.length,
      byStatus,
      byType,
      byPriority,
      totalStops,
      completedStops,
      failedStops,
      averageCompletionRate: totalStops > 0 ? (completedStops / totalStops) * 100 : 0,
      totalDistanceKm,
      activeRoutes,
      onTimeDeliveryRate: totalCompleted > 0 ? (onTimeCount / totalCompleted) * 100 : 0,
    };
  }

  // ==================== STOP METHODS ====================

  async updateStopStatus(stopId: string, dto: UpdateStopStatusDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOne({
      where: { id: stopId },
      relations: ['route'],
    });

    if (!stop) {
      throw new NotFoundException(`Stop with ID "${stopId}" not found`);
    }

    this.validateStopStatusTransition(stop.status, dto.status);

    stop.status = dto.status;
    stop.driverNotes = dto.driverNotes || stop.driverNotes;

    if (dto.failureReason) {
      stop.failureReason = dto.failureReason;
      stop.failureNotes = dto.failureNotes;
    }

    const savedStop = await this.stopRepository.save(stop);

    // Update route progress
    await this.updateRouteProgress(stop.routeId);

    // Notify order service
    this.notifyOrderStatusUpdate(stop.orderId, dto.status);

    return savedStop;
  }

  async arriveAtStop(stopId: string, dto: ArriveAtStopDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOneBy({ id: stopId });

    if (!stop) {
      throw new NotFoundException(`Stop with ID "${stopId}" not found`);
    }

    stop.status = StopStatus.ARRIVED;
    stop.actualArrivalTime = new Date();

    if (dto.latitude && dto.longitude) {
      // Could store arrival coordinates if needed
    }

    return this.stopRepository.save(stop);
  }

  async completeDelivery(stopId: string, dto: CompleteDeliveryDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOne({
      where: { id: stopId },
      relations: ['route'],
    });

    if (!stop) {
      throw new NotFoundException(`Stop with ID "${stopId}" not found`);
    }

    // Validate requirements
    if (stop.requiresSignature && !dto.signatureUrl) {
      throw new BadRequestException('Signature is required for this delivery');
    }

    if (stop.isCashOnDelivery && !dto.codCollected) {
      throw new BadRequestException('COD payment must be collected');
    }

    stop.status = StopStatus.DELIVERED;
    stop.actualDeliveryTime = new Date();
    stop.deliveryLocation = dto.deliveryLocation;
    stop.recipientName = dto.recipientName;
    stop.relationToCustomer = dto.relationToCustomer;
    stop.signatureUrl = dto.signatureUrl;
    stop.photoUrls = dto.photoUrls;
    stop.codCollected = dto.codCollected || false;
    stop.driverNotes = dto.driverNotes;

    // Calculate service time
    if (stop.actualArrivalTime) {
      stop.actualServiceMinutes = Math.round(
        (stop.actualDeliveryTime.getTime() - stop.actualArrivalTime.getTime()) / 60000,
      );
    }

    // Set departure time
    stop.departureTime = new Date();

    const savedStop = await this.stopRepository.save(stop);

    // Update route progress
    await this.updateRouteProgress(stop.routeId);

    // Move to next stop
    await this.moveToNextStop(stop.routeId, stop.plannedSequence);

    // Notify order service
    this.notifyOrderDelivered(stop.orderId, {
      deliveryTime: stop.actualDeliveryTime,
      recipientName: stop.recipientName,
      signatureUrl: stop.signatureUrl,
    });

    // Send delivery confirmation to customer
    this.sendDeliveryNotification(stop);

    return savedStop;
  }

  async failDelivery(stopId: string, dto: FailDeliveryDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOne({
      where: { id: stopId },
      relations: ['route'],
    });

    if (!stop) {
      throw new NotFoundException(`Stop with ID "${stopId}" not found`);
    }

    stop.status = StopStatus.FAILED;
    stop.failureReason = dto.failureReason;
    stop.failureNotes = dto.failureNotes;
    stop.photoUrls = dto.photoUrls;
    stop.driverNotes = dto.driverNotes;
    stop.actualDeliveryTime = new Date();

    if (dto.scheduleReattempt && stop.attemptNumber < stop.maxAttempts) {
      stop.status = StopStatus.RESCHEDULED;
      stop.nextAttemptDate = dto.nextAttemptDate;
      stop.attemptNumber += 1;
    }

    stop.departureTime = new Date();

    const savedStop = await this.stopRepository.save(stop);

    // Update route progress
    await this.updateRouteProgress(stop.routeId);

    // Move to next stop
    await this.moveToNextStop(stop.routeId, stop.plannedSequence);

    // Notify order service
    this.notifyOrderDeliveryFailed(stop.orderId, dto.failureReason, dto.failureNotes);

    return savedStop;
  }

  async rescheduleStop(stopId: string, dto: RescheduleStopDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOneBy({ id: stopId });

    if (!stop) {
      throw new NotFoundException(`Stop with ID "${stopId}" not found`);
    }

    stop.status = StopStatus.RESCHEDULED;
    stop.nextAttemptDate = dto.newDateTime;
    stop.timeWindowStart = dto.timeWindowStart;
    stop.timeWindowEnd = dto.timeWindowEnd;
    stop.driverNotes = dto.notes;

    return this.stopRepository.save(stop);
  }

  async updateStopSequence(routeId: string, dto: UpdateStopSequenceDto): Promise<RouteStop[]> {
    const route = await this.findRouteById(routeId);

    if (route.status === RouteStatus.COMPLETED) {
      throw new BadRequestException('Cannot reorder stops on completed route');
    }

    const stops = await this.stopRepository.find({
      where: { routeId },
    });

    // Update sequence based on new order
    for (let i = 0; i < dto.stopIds.length; i++) {
      const stop = stops.find(s => s.id === dto.stopIds[i]);
      if (stop) {
        stop.plannedSequence = i + 1;
      }
    }

    return this.stopRepository.save(stops);
  }

  async addCustomerRating(stopId: string, dto: CustomerRatingDto): Promise<RouteStop> {
    const stop = await this.stopRepository.findOneBy({ id: stopId });

    if (!stop) {
      throw new NotFoundException(`Stop with ID "${stopId}" not found`);
    }

    if (stop.status !== StopStatus.DELIVERED) {
      throw new BadRequestException('Can only rate delivered stops');
    }

    stop.customerRating = dto.rating;
    stop.customerFeedback = dto.feedback;

    const savedStop = await this.stopRepository.save(stop);

    // Update driver rating
    const route = await this.findRouteById(stop.routeId);
    if (route.driverId) {
      await this.updateDriverRating(route.driverId);
    }

    return savedStop;
  }

  async transferStops(dto: TransferStopsDto): Promise<RouteStop[]> {
    const targetRoute = await this.findRouteById(dto.targetRouteId);

    if (targetRoute.status === RouteStatus.COMPLETED) {
      throw new BadRequestException('Cannot transfer stops to completed route');
    }

    const stops = await this.stopRepository.find({
      where: { id: In(dto.stopIds) },
    });

    const maxSequence = targetRoute.stops.length;

    for (let i = 0; i < stops.length; i++) {
      stops[i].routeId = dto.targetRouteId;
      stops[i].plannedSequence = maxSequence + i + 1;
      stops[i].status = StopStatus.PENDING;
    }

    return this.stopRepository.save(stops);
  }

  async getStopStats(filter?: StopFilterDto): Promise<StopStatsDto> {
    const queryBuilder = this.stopRepository.createQueryBuilder('stop');

    if (filter?.routeId) {
      queryBuilder.andWhere('stop.routeId = :routeId', { routeId: filter.routeId });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stops = await queryBuilder.getMany();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let deliveredToday = 0;
    let failedToday = 0;
    let pendingToday = 0;
    let onTimeCount = 0;
    let totalServiceTime = 0;
    let serviceTimeCount = 0;
    let codCollected = 0;
    let totalRating = 0;
    let ratingCount = 0;

    for (const stop of stops) {
      byStatus[stop.status] = (byStatus[stop.status] || 0) + 1;
      byType[stop.stopType] = (byType[stop.stopType] || 0) + 1;

      if (stop.actualDeliveryTime && stop.actualDeliveryTime >= today && stop.actualDeliveryTime < tomorrow) {
        if (stop.status === StopStatus.DELIVERED) deliveredToday++;
        if (stop.status === StopStatus.FAILED) failedToday++;
      }

      if (stop.status === StopStatus.PENDING) pendingToday++;

      if (stop.status === StopStatus.DELIVERED && stop.timeWindowEnd && stop.actualDeliveryTime) {
        if (stop.actualDeliveryTime <= stop.timeWindowEnd) onTimeCount++;
      }

      if (stop.actualServiceMinutes) {
        totalServiceTime += stop.actualServiceMinutes;
        serviceTimeCount++;
      }

      if (stop.codCollected && stop.codAmount) {
        codCollected += stop.codAmount;
      }

      if (stop.customerRating) {
        totalRating += stop.customerRating;
        ratingCount++;
      }
    }

    const deliveredCount = byStatus[StopStatus.DELIVERED] || 0;

    return {
      totalStops: stops.length,
      byStatus,
      byType,
      deliveredToday,
      failedToday,
      pendingToday,
      onTimeRate: deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : 0,
      averageServiceTime: serviceTimeCount > 0 ? totalServiceTime / serviceTimeCount : 0,
      codCollected,
      averageRating: ratingCount > 0 ? totalRating / ratingCount : 0,
    };
  }

  // ==================== DRIVER METHODS ====================

  async createDriver(dto: CreateDriverDto): Promise<Driver> {
    const existing = await this.driverRepository.findOneBy({ employeeId: dto.employeeId });
    if (existing) {
      throw new ConflictException(`Driver with employee ID "${dto.employeeId}" already exists`);
    }

    const driver = this.driverRepository.create({
      ...dto,
      status: DriverStatus.OFF_DUTY,
      isActive: true,
    });

    return this.driverRepository.save(driver);
  }

  async findAllDrivers(filter: DriverFilterDto): Promise<any> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.driverRepository
      .createQueryBuilder('driver')
      .orderBy('driver.lastName', 'ASC');

    if (filter.status) {
      queryBuilder.andWhere('driver.status = :status', { status: filter.status });
    }

    if (filter.driverType) {
      queryBuilder.andWhere('driver.driverType = :driverType', { driverType: filter.driverType });
    }

    if (filter.isActive !== undefined) {
      queryBuilder.andWhere('driver.isActive = :isActive', { isActive: filter.isActive });
    }

    if (filter.canHandleHazmat) {
      queryBuilder.andWhere('driver.canHandleHazmat = true');
    }

    if (filter.canHandleRefrigerated) {
      queryBuilder.andWhere('driver.canHandleRefrigerated = true');
    }

    if (filter.search) {
      queryBuilder.andWhere(
        '(driver.firstName ILIKE :search OR driver.lastName ILIKE :search OR driver.employeeId ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDriverById(id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
    return driver;
  }

  async updateDriver(id: string, dto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findDriverById(id);
    Object.assign(driver, dto);
    return this.driverRepository.save(driver);
  }

  async updateDriverStatus(id: string, dto: UpdateDriverStatusDto): Promise<Driver> {
    const driver = await this.findDriverById(id);
    driver.status = dto.status;

    if (dto.latitude && dto.longitude) {
      driver.currentLatitude = dto.latitude;
      driver.currentLongitude = dto.longitude;
      driver.lastLocationUpdate = new Date();
    }

    return this.driverRepository.save(driver);
  }

  async startDriverShift(id: string, dto: StartShiftDto): Promise<Driver> {
    const driver = await this.findDriverById(id);

    driver.status = DriverStatus.AVAILABLE;
    driver.shiftStartTime = new Date();

    if (dto.latitude && dto.longitude) {
      driver.currentLatitude = dto.latitude;
      driver.currentLongitude = dto.longitude;
      driver.lastLocationUpdate = new Date();
    }

    if (dto.deviceId) driver.deviceId = dto.deviceId;
    if (dto.appVersion) driver.appVersion = dto.appVersion;

    driver.lastAppActivity = new Date();

    return this.driverRepository.save(driver);
  }

  async endDriverShift(id: string, dto: EndShiftDto): Promise<Driver> {
    const driver = await this.findDriverById(id);

    driver.status = DriverStatus.OFF_DUTY;
    driver.shiftEndTime = new Date();

    if (dto.latitude && dto.longitude) {
      driver.currentLatitude = dto.latitude;
      driver.currentLongitude = dto.longitude;
    }

    return this.driverRepository.save(driver);
  }

  async updateDriverLocation(id: string, dto: DriverLocationUpdateDto): Promise<Driver> {
    const driver = await this.findDriverById(id);

    driver.currentLatitude = dto.latitude;
    driver.currentLongitude = dto.longitude;
    driver.lastLocationUpdate = new Date();
    driver.lastAppActivity = new Date();

    return this.driverRepository.save(driver);
  }

  async getDriverStats(): Promise<DriverStatsDto> {
    const drivers = await this.driverRepository.find({ where: { isActive: true } });

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalDeliveries = 0;
    let totalRatings = 0;
    let ratingSum = 0;

    for (const driver of drivers) {
      byStatus[driver.status] = (byStatus[driver.status] || 0) + 1;
      byType[driver.driverType] = (byType[driver.driverType] || 0) + 1;
      totalDeliveries += driver.totalDeliveries;
      if (driver.averageRating && driver.totalRatings > 0) {
        ratingSum += driver.averageRating * driver.totalRatings;
        totalRatings += driver.totalRatings;
      }
    }

    const topPerformers = await this.driverRepository.find({
      where: { isActive: true },
      order: { averageRating: 'DESC', totalDeliveries: 'DESC' },
      take: 5,
    });

    return {
      totalDrivers: drivers.length,
      byStatus,
      byType,
      availableDrivers: byStatus[DriverStatus.AVAILABLE] || 0,
      onRouteDrivers: byStatus[DriverStatus.ON_ROUTE] || 0,
      averageRating: totalRatings > 0 ? ratingSum / totalRatings : 0,
      averageDeliveriesPerDriver: drivers.length > 0 ? totalDeliveries / drivers.length : 0,
      topPerformers: topPerformers.map(d => ({
        id: d.id,
        name: `${d.firstName} ${d.lastName}`,
        rating: d.averageRating,
        deliveries: d.totalDeliveries,
      })),
    };
  }

  // ==================== HELPER METHODS ====================

  private generateRouteNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `RT-${year}-${random}`;
  }

  private optimizeStopOrder(stops: any[]): any[] {
    // Simple nearest-neighbor optimization (placeholder for real implementation)
    // In production, use a proper routing API (Google Maps, Mapbox, etc.)
    return stops.sort((a, b) => (a.priority || 0) - (b.priority || 0));
  }

  private validateRouteStatusTransition(current: RouteStatus, next: RouteStatus): void {
    const validTransitions: Record<RouteStatus, RouteStatus[]> = {
      [RouteStatus.DRAFT]: [RouteStatus.PLANNED, RouteStatus.ASSIGNED, RouteStatus.CANCELLED],
      [RouteStatus.PLANNED]: [RouteStatus.ASSIGNED, RouteStatus.CANCELLED],
      [RouteStatus.ASSIGNED]: [RouteStatus.IN_PROGRESS, RouteStatus.PLANNED, RouteStatus.CANCELLED],
      [RouteStatus.IN_PROGRESS]: [RouteStatus.COMPLETED, RouteStatus.PARTIALLY_COMPLETED, RouteStatus.CANCELLED],
      [RouteStatus.PARTIALLY_COMPLETED]: [RouteStatus.COMPLETED],
      [RouteStatus.COMPLETED]: [],
      [RouteStatus.CANCELLED]: [],
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new BadRequestException(`Cannot transition route from ${current} to ${next}`);
    }
  }

  private validateStopStatusTransition(current: StopStatus, next: StopStatus): void {
    const validTransitions: Record<StopStatus, StopStatus[]> = {
      [StopStatus.PENDING]: [StopStatus.EN_ROUTE, StopStatus.SKIPPED, StopStatus.CANCELLED],
      [StopStatus.EN_ROUTE]: [StopStatus.ARRIVED, StopStatus.SKIPPED, StopStatus.CANCELLED],
      [StopStatus.ARRIVED]: [StopStatus.DELIVERING, StopStatus.FAILED, StopStatus.SKIPPED],
      [StopStatus.DELIVERING]: [StopStatus.DELIVERED, StopStatus.PARTIALLY_DELIVERED, StopStatus.FAILED],
      [StopStatus.DELIVERED]: [],
      [StopStatus.PARTIALLY_DELIVERED]: [StopStatus.DELIVERED, StopStatus.FAILED],
      [StopStatus.FAILED]: [StopStatus.RESCHEDULED, StopStatus.CANCELLED],
      [StopStatus.RESCHEDULED]: [StopStatus.PENDING, StopStatus.CANCELLED],
      [StopStatus.CANCELLED]: [],
      [StopStatus.SKIPPED]: [StopStatus.PENDING, StopStatus.CANCELLED],
    };

    if (!validTransitions[current]?.includes(next)) {
      throw new BadRequestException(`Cannot transition stop from ${current} to ${next}`);
    }
  }

  private async updateRouteProgress(routeId: string): Promise<void> {
    const stops = await this.stopRepository.find({ where: { routeId } });

    const completedStops = stops.filter(s => s.status === StopStatus.DELIVERED).length;
    const failedStops = stops.filter(s => s.status === StopStatus.FAILED).length;
    const skippedStops = stops.filter(s => s.status === StopStatus.SKIPPED).length;

    const completionPercentage = stops.length > 0
      ? ((completedStops + failedStops + skippedStops) / stops.length) * 100
      : 0;

    await this.routeRepository.update(routeId, {
      completedStops,
      failedStops,
      skippedStops,
      completionPercentage,
    });

    // Check if route is complete
    const allDone = stops.every(s =>
      s.status === StopStatus.DELIVERED ||
      s.status === StopStatus.FAILED ||
      s.status === StopStatus.SKIPPED ||
      s.status === StopStatus.CANCELLED,
    );

    if (allDone && stops.length > 0) {
      const hasFailures = failedStops > 0;
      await this.routeRepository.update(routeId, {
        status: hasFailures ? RouteStatus.PARTIALLY_COMPLETED : RouteStatus.COMPLETED,
        actualEndTime: new Date(),
      });
    }
  }

  private async moveToNextStop(routeId: string, currentSequence: number): Promise<void> {
    const nextStop = await this.stopRepository.findOne({
      where: {
        routeId,
        plannedSequence: currentSequence + 1,
        status: StopStatus.PENDING,
      },
    });

    if (nextStop) {
      nextStop.status = StopStatus.EN_ROUTE;
      await this.stopRepository.save(nextStop);
    }
  }

  private async updateDriverRating(driverId: string): Promise<void> {
    const routes = await this.routeRepository.find({ where: { driverId } });
    const routeIds = routes.map(r => r.id);

    if (routeIds.length === 0) return;

    const stops = await this.stopRepository.find({
      where: { routeId: In(routeIds) },
    });

    const ratings = stops.filter(s => s.customerRating).map(s => s.customerRating);

    if (ratings.length > 0) {
      const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      await this.driverRepository.update(driverId, {
        averageRating: Math.round(averageRating * 100) / 100,
        totalRatings: ratings.length,
        totalDeliveries: stops.filter(s => s.status === StopStatus.DELIVERED).length,
      });
    }
  }

  // Notification helpers (fire and forget)
  private async notifyOrdersAssignedToRoute(route: DeliveryRoute): Promise<void> {
    try {
      for (const stop of route.stops) {
        await this.httpService.axiosRef.patch(
          `${this.orderServiceUrl}/orders/${stop.orderId}/delivery-status`,
          { status: 'ASSIGNED_TO_ROUTE', routeId: route.id },
        );
      }
    } catch (error) {
      console.error('Failed to notify order service:', error.message);
    }
  }

  private async notifyOrderStatusUpdate(orderId: string, status: StopStatus): Promise<void> {
    try {
      await this.httpService.axiosRef.patch(
        `${this.orderServiceUrl}/orders/${orderId}/delivery-status`,
        { status },
      );
    } catch (error) {
      console.error('Failed to notify order service:', error.message);
    }
  }

  private async notifyOrderDelivered(orderId: string, details: any): Promise<void> {
    try {
      await this.httpService.axiosRef.patch(
        `${this.orderServiceUrl}/orders/${orderId}/delivery-status`,
        { status: 'DELIVERED', ...details },
      );
    } catch (error) {
      console.error('Failed to notify order service:', error.message);
    }
  }

  private async notifyOrderDeliveryFailed(orderId: string, reason: FailureReason, notes: string): Promise<void> {
    try {
      await this.httpService.axiosRef.patch(
        `${this.orderServiceUrl}/orders/${orderId}/delivery-status`,
        { status: 'DELIVERY_FAILED', failureReason: reason, notes },
      );
    } catch (error) {
      console.error('Failed to notify order service:', error.message);
    }
  }

  private async sendDeliveryNotification(stop: RouteStop): Promise<void> {
    try {
      await this.httpService.axiosRef.post(`${this.notificationServiceUrl}/notifications/send`, {
        type: 'DELIVERY_COMPLETED',
        channel: 'EMAIL',
        data: {
          orderId: stop.orderId,
          customerEmail: stop.customerEmail,
          customerName: stop.customerName,
          deliveryTime: stop.actualDeliveryTime,
          recipientName: stop.recipientName,
        },
      });
    } catch (error) {
      console.error('Failed to send notification:', error.message);
    }
  }
}