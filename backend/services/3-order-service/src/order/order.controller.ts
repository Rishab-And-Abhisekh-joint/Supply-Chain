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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { OrderService } from './order.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  ProcessPaymentDto,
  OrderFilterDto,
} from './dto/order.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Order, OrderStatus } from './entities/order.entity';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ============ CREATE ============
  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: Order,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient stock' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    // In a real app, customerId would come from authenticated user token
    // For now, we use the one from DTO or a default
    const customerId = createOrderDto.customerId || 'auth-user-' + Date.now();
    return this.orderService.create(createOrderDto, customerId);
  }

  // ============ READ ============
  @Get()
  @ApiOperation({ summary: 'Get all orders with optional filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated orders' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() filterDto: OrderFilterDto) {
    return this.orderService.findAll(filterDto);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent orders' })
  @ApiResponse({ status: 200, description: 'Returns recent orders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findRecent(@Query('limit') limit?: number) {
    return this.orderService.findRecent(limit || 10);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Returns order statistics' })
  getStats() {
    return this.orderService.getStats();
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer ID' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Returns customer orders' })
  findByCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.orderService.findByCustomer(customerId);
  }

  @Get('number/:orderNumber')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiParam({ name: 'orderNumber', description: 'Order number (e.g., ORD-2024-000001)' })
  @ApiResponse({ status: 200, description: 'Returns the order', type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findByOrderNumber(@Param('orderNumber') orderNumber: string) {
    return this.orderService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Returns the order', type: Order })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.findOne(id);
  }

  // ============ UPDATE ============
  @Patch(':id')
  @ApiOperation({ summary: 'Update order details' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Invalid update or order in final state' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, statusDto);
  }

  // ============ CANCEL ============
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Cannot cancel order in current state' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  cancelOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelOrderDto,
  ) {
    return this.orderService.cancelOrder(id, cancelDto);
  }

  // ============ PAYMENT ============
  @Post(':id/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment for an order' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully', type: Order })
  @ApiResponse({ status: 400, description: 'Cannot process payment' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  processPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() paymentDto: ProcessPaymentDto,
  ) {
    return this.orderService.processPayment(id, paymentDto);
  }
}