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
import { WarehouseService } from './warehouse.service';

// PickList DTOs
import {
  CreatePickListDto,
  UpdatePickListStatusDto,
  AssignPickListDto,
  UpdatePickListItemDto,
  VerifyPickListDto,
  PickListFilterDto,
} from './dto/picklist.dto';

// Receiving DTOs
import {
  CreateReceivingDto,
  UpdateReceivingStatusDto,
  ProcessReceivingItemDto,
  QualityCheckDto,
  ReceivingFilterDto,
} from './dto/receiving.dto';

// Location DTOs
import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationFilterDto,
} from './dto/location.dto';

@ApiTags('warehouse')
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  // ==================== PICKLIST ENDPOINTS ====================

  @Post('picklists')
  @ApiOperation({ summary: 'Create a new picklist for an order' })
  @ApiResponse({ status: 201, description: 'Picklist created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createPickList(@Body() dto: CreatePickListDto) {
    return this.warehouseService.createPickList(dto);
  }

  @Get('picklists')
  @ApiOperation({ summary: 'Get all picklists with optional filters' })
  @ApiResponse({ status: 200, description: 'List of picklists' })
  findAllPickLists(@Query() filterDto: PickListFilterDto) {
    return this.warehouseService.findAllPickLists(filterDto);
  }

  @Get('picklists/stats')
  @ApiOperation({ summary: 'Get picklist statistics' })
  @ApiResponse({ status: 200, description: 'Picklist statistics' })
  getPickListStats() {
    return this.warehouseService.getPickListStats();
  }

  @Get('picklists/order/:orderId')
  @ApiOperation({ summary: 'Get picklists for a specific order' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Picklists for the order' })
  findPickListsByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.warehouseService.findPickListsByOrder(orderId);
  }

  @Get('picklists/number/:pickListNumber')
  @ApiOperation({ summary: 'Get a picklist by its number' })
  @ApiParam({ name: 'pickListNumber', description: 'Picklist number (e.g., PL-2024-123456)' })
  @ApiResponse({ status: 200, description: 'Picklist found' })
  @ApiResponse({ status: 404, description: 'Picklist not found' })
  findPickListByNumber(@Param('pickListNumber') pickListNumber: string) {
    return this.warehouseService.findPickListByNumber(pickListNumber);
  }

  @Get('picklists/:id')
  @ApiOperation({ summary: 'Get a picklist by ID' })
  @ApiParam({ name: 'id', description: 'Picklist UUID' })
  @ApiResponse({ status: 200, description: 'Picklist found' })
  @ApiResponse({ status: 404, description: 'Picklist not found' })
  findPickListById(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.findPickListById(id);
  }

  @Patch('picklists/:id/status')
  @ApiOperation({ summary: 'Update picklist status' })
  @ApiParam({ name: 'id', description: 'Picklist UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Picklist not found' })
  updatePickListStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePickListStatusDto,
  ) {
    return this.warehouseService.updatePickListStatus(id, dto);
  }

  @Patch('picklists/:id/assign')
  @ApiOperation({ summary: 'Assign picklist to a worker' })
  @ApiParam({ name: 'id', description: 'Picklist UUID' })
  @ApiResponse({ status: 200, description: 'Picklist assigned' })
  @ApiResponse({ status: 400, description: 'Cannot assign picklist' })
  @ApiResponse({ status: 404, description: 'Picklist not found' })
  assignPickList(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignPickListDto,
  ) {
    return this.warehouseService.assignPickList(id, dto);
  }

  @Patch('picklists/:id/items/:itemId')
  @ApiOperation({ summary: 'Update a picklist item (mark as picked, etc.)' })
  @ApiParam({ name: 'id', description: 'Picklist UUID' })
  @ApiParam({ name: 'itemId', description: 'Picklist item UUID' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  @ApiResponse({ status: 404, description: 'Picklist or item not found' })
  updatePickListItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdatePickListItemDto,
  ) {
    return this.warehouseService.updatePickListItem(id, itemId, dto);
  }

  @Post('picklists/:id/verify')
  @ApiOperation({ summary: 'Verify a completed picklist' })
  @ApiParam({ name: 'id', description: 'Picklist UUID' })
  @ApiResponse({ status: 200, description: 'Picklist verified' })
  @ApiResponse({ status: 400, description: 'Cannot verify picklist' })
  @ApiResponse({ status: 404, description: 'Picklist not found' })
  verifyPickList(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPickListDto,
  ) {
    return this.warehouseService.verifyPickList(id, dto);
  }

  // ==================== RECEIVING ENDPOINTS ====================

  @Post('receiving')
  @ApiOperation({ summary: 'Create a new receiving record' })
  @ApiResponse({ status: 201, description: 'Receiving record created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  createReceiving(@Body() dto: CreateReceivingDto) {
    return this.warehouseService.createReceiving(dto);
  }

  @Get('receiving')
  @ApiOperation({ summary: 'Get all receiving records with optional filters' })
  @ApiResponse({ status: 200, description: 'List of receiving records' })
  findAllReceivings(@Query() filterDto: ReceivingFilterDto) {
    return this.warehouseService.findAllReceivings(filterDto);
  }

  @Get('receiving/stats')
  @ApiOperation({ summary: 'Get receiving statistics' })
  @ApiResponse({ status: 200, description: 'Receiving statistics' })
  getReceivingStats() {
    return this.warehouseService.getReceivingStats();
  }

  @Get('receiving/number/:receivingNumber')
  @ApiOperation({ summary: 'Get a receiving record by its number' })
  @ApiParam({ name: 'receivingNumber', description: 'Receiving number (e.g., RCV-2024-123456)' })
  @ApiResponse({ status: 200, description: 'Receiving record found' })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  findReceivingByNumber(@Param('receivingNumber') receivingNumber: string) {
    return this.warehouseService.findReceivingByNumber(receivingNumber);
  }

  @Get('receiving/:id')
  @ApiOperation({ summary: 'Get a receiving record by ID' })
  @ApiParam({ name: 'id', description: 'Receiving record UUID' })
  @ApiResponse({ status: 200, description: 'Receiving record found' })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  findReceivingById(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.findReceivingById(id);
  }

  @Patch('receiving/:id/status')
  @ApiOperation({ summary: 'Update receiving record status' })
  @ApiParam({ name: 'id', description: 'Receiving record UUID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  updateReceivingStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReceivingStatusDto,
  ) {
    return this.warehouseService.updateReceivingStatus(id, dto);
  }

  @Patch('receiving/:id/items/:itemId')
  @ApiOperation({ summary: 'Process a receiving item' })
  @ApiParam({ name: 'id', description: 'Receiving record UUID' })
  @ApiParam({ name: 'itemId', description: 'Receiving item UUID' })
  @ApiResponse({ status: 200, description: 'Item processed' })
  @ApiResponse({ status: 404, description: 'Receiving record or item not found' })
  processReceivingItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ProcessReceivingItemDto,
  ) {
    return this.warehouseService.processReceivingItem(id, itemId, dto);
  }

  @Post('receiving/:id/quality-check')
  @ApiOperation({ summary: 'Perform quality check on receiving' })
  @ApiParam({ name: 'id', description: 'Receiving record UUID' })
  @ApiResponse({ status: 200, description: 'Quality check completed' })
  @ApiResponse({ status: 400, description: 'Quality check not required' })
  @ApiResponse({ status: 404, description: 'Receiving record not found' })
  performQualityCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: QualityCheckDto,
  ) {
    return this.warehouseService.performQualityCheck(id, dto);
  }

  // ==================== LOCATION ENDPOINTS ====================

  @Post('locations')
  @ApiOperation({ summary: 'Create a new warehouse location' })
  @ApiResponse({ status: 201, description: 'Location created' })
  @ApiResponse({ status: 400, description: 'Location code already exists' })
  createLocation(@Body() dto: CreateLocationDto) {
    return this.warehouseService.createLocation(dto);
  }

  @Get('locations')
  @ApiOperation({ summary: 'Get all warehouse locations with optional filters' })
  @ApiResponse({ status: 200, description: 'List of locations' })
  findAllLocations(@Query() filterDto: LocationFilterDto) {
    return this.warehouseService.findAllLocations(filterDto);
  }

  @Get('locations/stats')
  @ApiOperation({ summary: 'Get location statistics' })
  @ApiResponse({ status: 200, description: 'Location statistics' })
  getLocationStats() {
    return this.warehouseService.getLocationStats();
  }

  @Get('locations/code/:code')
  @ApiOperation({ summary: 'Get a location by its code' })
  @ApiParam({ name: 'code', description: 'Location code (e.g., A-05-B-03)' })
  @ApiResponse({ status: 200, description: 'Location found' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  findLocationByCode(@Param('code') code: string) {
    return this.warehouseService.findLocationByCode(code);
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Location found' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  findLocationById(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.findLocationById(id);
  }

  @Patch('locations/:id')
  @ApiOperation({ summary: 'Update a location' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.warehouseService.updateLocation(id, dto);
  }

  @Delete('locations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a location' })
  @ApiParam({ name: 'id', description: 'Location UUID' })
  @ApiResponse({ status: 204, description: 'Location deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete location with items' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  deleteLocation(@Param('id', ParseUUIDPipe) id: string) {
    return this.warehouseService.deleteLocation(id);
  }
}
