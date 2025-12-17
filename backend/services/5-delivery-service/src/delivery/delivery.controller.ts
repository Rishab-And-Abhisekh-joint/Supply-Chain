import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { DeliveryService } from './delivery.service';

import {
  CreateDeliveryRouteDto,
  UpdateRouteStatusDto,
  AssignDriverDto,
  StartRouteDto,
  UpdateLocationDto,
  RouteFilterDto,
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
  DriverLocationUpdateDto,
} from './dto/driver.dto';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  // ==================== ROUTE ENDPOINTS ====================

  @Post('routes')
  @ApiOperation({ summary: 'Create a new delivery route' })
  @ApiResponse({ status: 201, description: 'Route successfully created' })
  createRoute(@Body() dto: CreateDeliveryRouteDto) {
    return this.deliveryService.createRoute(dto);
  }

  @Post('routes/optimize')
  @ApiOperation({ summary: 'Create an optimized delivery route' })
  @ApiResponse({ status: 201, description: 'Optimized route successfully created' })
  createOptimizedRoute(@Body() dto: CreateDeliveryRouteDto) {
    return this.deliveryService.createOptimizedRoute(dto);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Get all delivery routes with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of routes' })
  getAllRoutes(@Query() filter: RouteFilterDto) {
    return this.deliveryService.findAllRoutes(filter);
  }

  @Get('routes/stats')
  @ApiOperation({ summary: 'Get route statistics' })
  @ApiResponse({ status: 200, description: 'Returns route statistics' })
  getRouteStats(@Query() filter: RouteFilterDto) {
    return this.deliveryService.getRouteStats(filter);
  }

  @Get('routes/driver/:driverId')
  @ApiOperation({ summary: 'Get routes by driver ID' })
  @ApiParam({ name: 'driverId', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Returns driver routes' })
  getRoutesByDriver(@Param('driverId', ParseUUIDPipe) driverId: string) {
    return this.deliveryService.findRoutesByDriver(driverId);
  }

  @Get('routes/number/:routeNumber')
  @ApiOperation({ summary: 'Get route by route number' })
  @ApiParam({ name: 'routeNumber', description: 'Route number' })
  @ApiResponse({ status: 200, description: 'Returns route details' })
  getRouteByNumber(@Param('routeNumber') routeNumber: string) {
    return this.deliveryService.findRouteByNumber(routeNumber);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get route by ID' })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({ status: 200, description: 'Returns route details' })
  getRouteById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryService.findRouteById(id);
  }

  @Patch('routes/:id/status')
  @ApiOperation({ summary: 'Update route status' })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({ status: 200, description: 'Route status updated' })
  updateRouteStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteStatusDto,
  ) {
    return this.deliveryService.updateRouteStatus(id, dto);
  }

  @Patch('routes/:id/assign')
  @ApiOperation({ summary: 'Assign driver to route' })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({ status: 200, description: 'Driver assigned to route' })
  assignDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignDriverDto,
  ) {
    return this.deliveryService.assignDriver(id, dto);
  }

  @Post('routes/:id/start')
  @ApiOperation({ summary: 'Start a delivery route' })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({ status: 200, description: 'Route started' })
  startRoute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartRouteDto,
  ) {
    return this.deliveryService.startRoute(id, dto);
  }

  @Patch('routes/:id/location')
  @ApiOperation({ summary: 'Update route current location' })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  updateRouteLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.deliveryService.updateRouteLocation(id, dto);
  }

  @Patch('routes/:id/sequence')
  @ApiOperation({ summary: 'Reorder stops in a route' })
  @ApiParam({ name: 'id', description: 'Route UUID' })
  @ApiResponse({ status: 200, description: 'Stop sequence updated' })
  updateStopSequence(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStopSequenceDto,
  ) {
    return this.deliveryService.updateStopSequence(id, dto);
  }

  // ==================== STOP ENDPOINTS ====================

  @Get('stops/stats')
  @ApiOperation({ summary: 'Get stop statistics' })
  @ApiResponse({ status: 200, description: 'Returns stop statistics' })
  getStopStats(@Query() filter: StopFilterDto) {
    return this.deliveryService.getStopStats(filter);
  }

  @Patch('stops/:stopId/status')
  @ApiOperation({ summary: 'Update stop status' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({ status: 200, description: 'Stop status updated' })
  updateStopStatus(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: UpdateStopStatusDto,
  ) {
    return this.deliveryService.updateStopStatus(stopId, dto);
  }

  @Post('stops/:stopId/arrive')
  @ApiOperation({ summary: 'Mark arrival at stop' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({ status: 200, description: 'Arrival recorded' })
  arriveAtStop(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: ArriveAtStopDto,
  ) {
    return this.deliveryService.arriveAtStop(stopId, dto);
  }

  @Post('stops/:stopId/complete')
  @ApiOperation({ summary: 'Complete delivery at stop' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({ status: 200, description: 'Delivery completed' })
  completeDelivery(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: CompleteDeliveryDto,
  ) {
    return this.deliveryService.completeDelivery(stopId, dto);
  }

  @Post('stops/:stopId/fail')
  @ApiOperation({ summary: 'Record failed delivery' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({ status: 200, description: 'Failure recorded' })
  failDelivery(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: FailDeliveryDto,
  ) {
    return this.deliveryService.failDelivery(stopId, dto);
  }

  @Post('stops/:stopId/reschedule')
  @ApiOperation({ summary: 'Reschedule a stop' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({ status: 200, description: 'Stop rescheduled' })
  rescheduleStop(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: RescheduleStopDto,
  ) {
    return this.deliveryService.rescheduleStop(stopId, dto);
  }

  @Post('stops/:stopId/rating')
  @ApiOperation({ summary: 'Add customer rating for delivery' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  @ApiResponse({ status: 200, description: 'Rating added' })
  addCustomerRating(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: CustomerRatingDto,
  ) {
    return this.deliveryService.addCustomerRating(stopId, dto);
  }

  @Post('stops/transfer')
  @ApiOperation({ summary: 'Transfer stops to another route' })
  @ApiResponse({ status: 200, description: 'Stops transferred' })
  transferStops(@Body() dto: TransferStopsDto) {
    return this.deliveryService.transferStops(dto);
  }

  // ==================== DRIVER ENDPOINTS ====================

  @Post('drivers')
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, description: 'Driver created' })
  createDriver(@Body() dto: CreateDriverDto) {
    return this.deliveryService.createDriver(dto);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get all drivers with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of drivers' })
  getAllDrivers(@Query() filter: DriverFilterDto) {
    return this.deliveryService.findAllDrivers(filter);
  }

  @Get('drivers/stats')
  @ApiOperation({ summary: 'Get driver statistics' })
  @ApiResponse({ status: 200, description: 'Returns driver statistics' })
  getDriverStats() {
    return this.deliveryService.getDriverStats();
  }

  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get driver by ID' })
  @ApiParam({ name: 'id', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Returns driver details' })
  getDriverById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryService.findDriverById(id);
  }

  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Update driver details' })
  @ApiParam({ name: 'id', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Driver updated' })
  updateDriver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.deliveryService.updateDriver(id, dto);
  }

  @Patch('drivers/:id/status')
  @ApiOperation({ summary: 'Update driver status' })
  @ApiParam({ name: 'id', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Driver status updated' })
  updateDriverStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverStatusDto,
  ) {
    return this.deliveryService.updateDriverStatus(id, dto);
  }

  @Post('drivers/:id/shift/start')
  @ApiOperation({ summary: 'Start driver shift' })
  @ApiParam({ name: 'id', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Shift started' })
  startDriverShift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StartShiftDto,
  ) {
    return this.deliveryService.startDriverShift(id, dto);
  }

  @Post('drivers/:id/shift/end')
  @ApiOperation({ summary: 'End driver shift' })
  @ApiParam({ name: 'id', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Shift ended' })
  endDriverShift(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EndShiftDto,
  ) {
    return this.deliveryService.endDriverShift(id, dto);
  }

  @Patch('drivers/:id/location')
  @ApiOperation({ summary: 'Update driver location' })
  @ApiParam({ name: 'id', description: 'Driver UUID' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  updateDriverLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DriverLocationUpdateDto,
  ) {
    return this.deliveryService.updateDriverLocation(id, dto);
  }
}