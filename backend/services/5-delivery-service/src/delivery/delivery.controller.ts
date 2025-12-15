import { Controller, Get, Post, Body, Patch, Param, ParseUUIDPipe } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryRouteDto } from './dto/create-delivery-route.dto';
import { UpdateStopStatusDto } from './dto/update-stop-status.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post('routes')
  @ApiOperation({ summary: 'Create a new delivery route' })
  @ApiResponse({ status: 201, description: 'Route successfully created.' })
  createRoute(@Body() createDeliveryRouteDto: CreateDeliveryRouteDto) {
    return this.deliveryService.createRoute(createDeliveryRouteDto);
  }
  
  @Post('routes/optimize')
  @ApiOperation({ summary: 'Create an optimized delivery route' })
  @ApiResponse({ status: 201, description: 'Optimized route successfully created.' })
  createOptimizedRoute(@Body() createDeliveryRouteDto: CreateDeliveryRouteDto) {
    return this.deliveryService.createOptimizedRoute(createDeliveryRouteDto);
  }

  @Get('routes')
  @ApiOperation({ summary: 'Retrieve all delivery routes' })
  getAllRoutes() {
    return this.deliveryService.findAllRoutes();
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Retrieve a single delivery route by ID' })
  getRouteById(@Param('id', ParseUUIDPipe) id: string) {
    return this.deliveryService.findRouteById(id);
  }

  @Patch('stops/:stopId/status')
  @ApiOperation({ summary: 'Update the status of a specific stop on a route' })
  updateStopStatus(
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() updateStopStatusDto: UpdateStopStatusDto,
  ) {
    return this.deliveryService.updateStopStatus(stopId, updateStopStatusDto);
  }
} 