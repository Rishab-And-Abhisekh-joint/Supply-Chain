import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Order, OrderStatus, PaymentStatus, DeliveryType } from './entities/order.entity';
import { OrderItem, OrderItemStatus } from './entities/order-item.entity';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
  ProcessPaymentDto,
  OrderFilterDto,
  OrderStatsDto,
  PaginatedOrdersDto,
} from './dto/order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  private inventoryServiceUrl: string;
  private deliveryServiceUrl: string;
  private notificationServiceUrl: string;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL') || 'http://localhost:3001';
    this.deliveryServiceUrl = this.configService.get<string>('DELIVERY_SERVICE_URL') || 'http://localhost:3004';
    this.notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:3005';
  }

  // ============ CREATE ORDER ============
  async create(createOrderDto: CreateOrderDto, customerId?: string): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let subtotal = 0;
      const orderItems: OrderItem[] = [];

      // Validate and process each item
      for (const itemDto of createOrderDto.items) {
        let product: any = null;
        let unitPrice = itemDto.unitPrice;
        let productName = itemDto.productName || 'Unknown Product';
        let productSku = itemDto.productSku || '';

        // Try to fetch product details from inventory service
        try {
          const productUrl = `${this.inventoryServiceUrl}/products/${itemDto.productId}`;
          const response = await firstValueFrom(this.httpService.get(productUrl));
          product = response.data;
          
          if (product) {
            unitPrice = unitPrice ?? parseFloat(product.price);
            productName = product.name || productName;
            productSku = product.sku || productSku;

            // Check stock availability
            if (product.stock < itemDto.quantity) {
              throw new BadRequestException(
                `Insufficient stock for product ${productName}. Available: ${product.stock}, Requested: ${itemDto.quantity}`
              );
            }
          }
        } catch (error) {
          if (error instanceof BadRequestException) throw error;
          this.logger.warn(`Could not fetch product ${itemDto.productId} from inventory service: ${error.message}`);
        }

        if (!unitPrice) {
          throw new BadRequestException(`Price not available for product ${itemDto.productId}`);
        }

        const discount = itemDto.discount || 0;
        const itemTotal = (unitPrice * itemDto.quantity) - discount;
        subtotal += itemTotal;

        const orderItem = new OrderItem();
        orderItem.productId = itemDto.productId;
        orderItem.productName = productName;
        orderItem.productSku = productSku;
        orderItem.quantity = itemDto.quantity;
        orderItem.unitPrice = unitPrice;
        orderItem.discount = discount;
        orderItem.totalPrice = itemTotal;
        orderItem.status = OrderItemStatus.PENDING;
        orderItem.notes = itemDto.notes;

        orderItems.push(orderItem);
      }

      // Calculate totals
      const taxRate = 0.08; // 8% tax - could be configurable
      const taxAmount = subtotal * taxRate;
      const shippingCost = this.calculateShippingCost(createOrderDto.deliveryType || DeliveryType.STANDARD);
      const totalAmount = subtotal + taxAmount + shippingCost;

      // Calculate expected delivery date
      const expectedDeliveryDate = this.calculateExpectedDeliveryDate(
        createOrderDto.deliveryType || DeliveryType.STANDARD
      );

      // Create the order
      const order = new Order();
      order.customerId = customerId || createOrderDto.customerId || 'guest';
      order.customerName = createOrderDto.customerName;
      order.customerEmail = createOrderDto.customerEmail;
      order.customerPhone = createOrderDto.customerPhone;
      order.shippingAddress = createOrderDto.shippingAddress;
      order.shippingCity = createOrderDto.shippingCity;
      order.shippingState = createOrderDto.shippingState;
      order.shippingCountry = createOrderDto.shippingCountry;
      order.shippingZipCode = createOrderDto.shippingZipCode;
      order.billingAddress = createOrderDto.billingAddress || createOrderDto.shippingAddress;
      order.deliveryType = createOrderDto.deliveryType || DeliveryType.STANDARD;
      order.subtotal = subtotal;
      order.taxAmount = taxAmount;
      order.shippingCost = shippingCost;
      order.totalAmount = totalAmount;
      order.status = OrderStatus.PENDING;
      order.paymentStatus = PaymentStatus.PENDING;
      order.notes = createOrderDto.notes;
      order.isPriority = createOrderDto.isPriority || false;
      order.isGift = createOrderDto.isGift || false;
      order.giftMessage = createOrderDto.giftMessage;
      order.paymentMethod = createOrderDto.paymentMethod;
      order.expectedDeliveryDate = expectedDeliveryDate;
      order.items = orderItems;

      const savedOrder = await queryRunner.manager.save(order);

      // Reserve stock in inventory service
      for (const item of savedOrder.items) {
        try {
          const reserveUrl = `${this.inventoryServiceUrl}/products/reserve/${item.productId}`;
          await firstValueFrom(
            this.httpService.post(reserveUrl, {
              quantity: item.quantity,
              orderId: savedOrder.id,
            })
          );
          
          // Update item to reflect reservation
          item.stockReserved = true;
          item.reservationId = savedOrder.id;
          await queryRunner.manager.save(item);
        } catch (error) {
          this.logger.warn(`Could not reserve stock for product ${item.productId}: ${error.message}`);
        }
      }

      await queryRunner.commitTransaction();

      // Send order confirmation notification (async, don't wait)
      this.sendOrderConfirmationNotification(savedOrder).catch(err => 
        this.logger.warn(`Failed to send order confirmation: ${err.message}`)
      );

      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Order creation failed:', error.message);
      throw new BadRequestException(error.message || 'Order creation failed');
    } finally {
      await queryRunner.release();
    }
  }

  // ============ FIND ORDERS ============
  async findAll(filterDto?: OrderFilterDto): Promise<PaginatedOrdersDto> {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .orderBy('order.orderDate', 'DESC');

    if (filterDto?.status) {
      queryBuilder.andWhere('order.status = :status', { status: filterDto.status });
    }
    if (filterDto?.paymentStatus) {
      queryBuilder.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus: filterDto.paymentStatus });
    }
    if (filterDto?.customerId) {
      queryBuilder.andWhere('order.customerId = :customerId', { customerId: filterDto.customerId });
    }
    if (filterDto?.startDate) {
      queryBuilder.andWhere('order.orderDate >= :startDate', { startDate: filterDto.startDate });
    }
    if (filterDto?.endDate) {
      queryBuilder.andWhere('order.orderDate <= :endDate', { endDate: filterDto.endDate });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRecent(limit: number = 10): Promise<Order[]> {
    return this.orderRepository.find({
      order: { orderDate: 'DESC' },
      take: limit,
      relations: ['items'],
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { orderNumber },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException(`Order with number "${orderNumber}" not found`);
    }
    return order;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId },
      relations: ['items'],
      order: { orderDate: 'DESC' },
    });
  }

  // ============ UPDATE ORDER ============
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    
    // Don't allow updates to delivered or cancelled orders
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException(`Cannot update order in ${order.status} status`);
    }

    Object.assign(order, updateOrderDto);
    
    if (updateOrderDto.expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(updateOrderDto.expectedDeliveryDate);
    }

    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, statusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    const oldStatus = order.status;

    // Validate status transitions
    this.validateStatusTransition(oldStatus, statusDto.status);

    order.status = statusDto.status;
    
    if (statusDto.internalNotes) {
      order.internalNotes = order.internalNotes 
        ? `${order.internalNotes}\n[${new Date().toISOString()}] ${statusDto.internalNotes}`
        : `[${new Date().toISOString()}] ${statusDto.internalNotes}`;
    }

    // Handle special status transitions
    if (statusDto.status === OrderStatus.SHIPPED && !order.transitId) {
      // Create delivery record
      await this.createDeliveryRecord(order);
    }

    if (statusDto.status === OrderStatus.DELIVERED) {
      order.actualDeliveryDate = new Date();
      // Commit stock reservations
      await this.commitStockReservations(order);
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Send status update notification
    this.sendStatusUpdateNotification(updatedOrder, oldStatus).catch(err =>
      this.logger.warn(`Failed to send status update notification: ${err.message}`)
    );

    return updatedOrder;
  }

  // ============ CANCEL ORDER ============
  async cancelOrder(id: string, cancelDto: CancelOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    // Don't allow cancellation of delivered orders
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel order in ${order.status} status`);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancellationReason = cancelDto.reason;
    order.cancelledAt = new Date();

    // Release stock reservations
    if (cancelDto.restockItems !== false) {
      await this.releaseStockReservations(order);
    }

    // Process refund if needed
    if (cancelDto.refund && order.amountPaid > 0) {
      order.paymentStatus = PaymentStatus.REFUNDED;
      // In real implementation, trigger refund process
    }

    // Cancel delivery if created
    if (order.transitId) {
      await this.cancelDelivery(order.transitId);
    }

    const savedOrder = await this.orderRepository.save(order);

    // Send cancellation notification
    this.sendCancellationNotification(savedOrder).catch(err =>
      this.logger.warn(`Failed to send cancellation notification: ${err.message}`)
    );

    return savedOrder;
  }

  // ============ PAYMENT PROCESSING ============
  async processPayment(id: string, paymentDto: ProcessPaymentDto): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot process payment for cancelled order');
    }

    order.amountPaid += paymentDto.amount;
    order.paymentMethod = paymentDto.paymentMethod;
    order.paymentReference = paymentDto.paymentReference || order.paymentReference;

    // Update payment status
    if (order.amountPaid >= order.totalAmount) {
      order.paymentStatus = PaymentStatus.PAID;
      // Automatically confirm order when fully paid
      if (order.status === OrderStatus.PENDING) {
        order.status = OrderStatus.CONFIRMED;
      }
    } else if (order.amountPaid > 0) {
      order.paymentStatus = PaymentStatus.PARTIALLY_PAID;
    }

    return this.orderRepository.save(order);
  }

  // ============ STATISTICS ============
  async getStats(): Promise<OrderStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.orderRepository.count({ where: { status: OrderStatus.PROCESSING } }),
      this.orderRepository.count({ where: { status: OrderStatus.SHIPPED } }),
      this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
      this.orderRepository.count({ where: { status: OrderStatus.CANCELLED } }),
      this.orderRepository.count({ where: { orderDate: MoreThanOrEqual(today) } }),
    ]);

    // Calculate revenue
    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .getRawOne();

    const todayRevenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.orderDate >= :today', { today })
      .andWhere('order.status != :cancelled', { cancelled: OrderStatus.CANCELLED })
      .andWhere('order.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .getRawOne();

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue: parseFloat(revenueResult?.total) || 0,
      todayOrders,
      todayRevenue: parseFloat(todayRevenueResult?.total) || 0,
    };
  }

  // ============ HELPER METHODS ============
  private calculateShippingCost(deliveryType: DeliveryType): number {
    const shippingRates: Record<DeliveryType, number> = {
      [DeliveryType.STANDARD]: 5.99,
      [DeliveryType.EXPRESS]: 12.99,
      [DeliveryType.OVERNIGHT]: 24.99,
      [DeliveryType.SAME_DAY]: 34.99,
      [DeliveryType.PICKUP]: 0,
    };
    return shippingRates[deliveryType] || 5.99;
  }

  private calculateExpectedDeliveryDate(deliveryType: DeliveryType): Date {
    const date = new Date();
    const daysToAdd: Record<DeliveryType, number> = {
      [DeliveryType.STANDARD]: 5,
      [DeliveryType.EXPRESS]: 2,
      [DeliveryType.OVERNIGHT]: 1,
      [DeliveryType.SAME_DAY]: 0,
      [DeliveryType.PICKUP]: 1,
    };
    date.setDate(date.getDate() + (daysToAdd[deliveryType] || 5));
    return date;
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
      [OrderStatus.PROCESSING]: [OrderStatus.PACKED, OrderStatus.CANCELLED, OrderStatus.ON_HOLD],
      [OrderStatus.PACKED]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED],
      [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
      [OrderStatus.ON_HOLD]: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async createDeliveryRecord(order: Order): Promise<void> {
    try {
      const deliveryPayload = {
        orderId: order.id,
        originAddress: 'Warehouse Address', // Should come from warehouse service
        destinationAddress: order.shippingAddress,
        destinationCity: order.shippingCity,
        destinationState: order.shippingState,
        destinationCountry: order.shippingCountry,
        destinationZipCode: order.shippingZipCode,
        recipientName: order.customerName,
        recipientPhone: order.customerPhone,
        deliveryInstructions: order.notes,
        estimatedArrival: order.expectedDeliveryDate,
      };

      const response = await firstValueFrom(
        this.httpService.post(`${this.deliveryServiceUrl}/delivery`, deliveryPayload)
      );

      if (response.data) {
        order.transitId = response.data.id;
        order.trackingNumber = response.data.trackingNumber;
        await this.orderRepository.save(order);
      }
    } catch (error) {
      this.logger.warn(`Failed to create delivery record: ${error.message}`);
    }
  }

  private async cancelDelivery(transitId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.patch(`${this.deliveryServiceUrl}/delivery/${transitId}/status`, {
          status: 'CANCELLED',
        })
      );
    } catch (error) {
      this.logger.warn(`Failed to cancel delivery: ${error.message}`);
    }
  }

  private async releaseStockReservations(order: Order): Promise<void> {
    for (const item of order.items) {
      if (item.stockReserved) {
        try {
          await firstValueFrom(
            this.httpService.post(
              `${this.inventoryServiceUrl}/products/release/${item.productId}`,
              { quantity: item.quantity, orderId: order.id }
            )
          );
        } catch (error) {
          this.logger.warn(`Failed to release stock for product ${item.productId}: ${error.message}`);
        }
      }
    }
  }

  private async commitStockReservations(order: Order): Promise<void> {
    for (const item of order.items) {
      if (item.stockReserved) {
        try {
          await firstValueFrom(
            this.httpService.post(
              `${this.inventoryServiceUrl}/products/commit/${item.productId}`,
              { quantity: item.quantity, orderId: order.id }
            )
          );
        } catch (error) {
          this.logger.warn(`Failed to commit stock for product ${item.productId}: ${error.message}`);
        }
      }
    }
  }

  private async sendOrderConfirmationNotification(order: Order): Promise<void> {
    if (!order.customerEmail) return;

    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/notifications/send`, {
          type: 'ORDER_CONFIRMATION',
          recipientEmail: order.customerEmail,
          recipientName: order.customerName,
          data: {
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            expectedDeliveryDate: order.expectedDeliveryDate,
          },
        })
      );
    } catch (error) {
      this.logger.warn(`Notification service unavailable: ${error.message}`);
    }
  }

  private async sendStatusUpdateNotification(order: Order, oldStatus: OrderStatus): Promise<void> {
    if (!order.customerEmail) return;

    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/notifications/send`, {
          type: 'ORDER_STATUS_UPDATE',
          recipientEmail: order.customerEmail,
          recipientName: order.customerName,
          data: {
            orderNumber: order.orderNumber,
            oldStatus,
            newStatus: order.status,
            trackingNumber: order.trackingNumber,
          },
        })
      );
    } catch (error) {
      this.logger.warn(`Notification service unavailable: ${error.message}`);
    }
  }

  private async sendCancellationNotification(order: Order): Promise<void> {
    if (!order.customerEmail) return;

    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/notifications/send`, {
          type: 'ORDER_CANCELLED',
          recipientEmail: order.customerEmail,
          recipientName: order.customerName,
          data: {
            orderNumber: order.orderNumber,
            reason: order.cancellationReason,
          },
        })
      );
    } catch (error) {
      this.logger.warn(`Notification service unavailable: ${error.message}`);
    }
  }
}