import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  private inventoryServiceUrl: string;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL');
  }

  async create(customerId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // 1. Validate stock and calculate total amount
      for (const itemDto of createOrderDto.items) {
        // --- Inter-service communication: Check product details and stock ---
        const productUrl = `${this.inventoryServiceUrl}/products/${itemDto.productId}`;
        const { data: product } = await firstValueFrom(this.httpService.get(productUrl));

        if (!product) {
          throw new BadRequestException(`Product with ID ${itemDto.productId} not found.`);
        }
        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(`Insufficient stock for product ${product.name}.`);
        }

        const price = parseFloat(product.price);
        totalAmount += price * itemDto.quantity;
        
        const orderItem = new OrderItem();
        orderItem.productId = itemDto.productId;
        orderItem.quantity = itemDto.quantity;
        orderItem.price = price;
        orderItems.push(orderItem);
      }

      // 2. Create the Order
      const order = new Order();
      order.customerId = customerId;
      order.shippingAddress = createOrderDto.shippingAddress;
      order.totalAmount = totalAmount;
      order.status = OrderStatus.PENDING;
      order.items = orderItems;

      const savedOrder = await queryRunner.manager.save(order);

      // 3. Adjust stock in inventory service for each item
      for (const item of savedOrder.items) {
        const stockAdjustmentUrl = `${this.inventoryServiceUrl}/products/stock/${item.productId}`;
        await firstValueFrom(
          this.httpService.patch(stockAdjustmentUrl, { quantity: -item.quantity })
        );
      }

      await queryRunner.commitTransaction();
      return savedOrder;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Order creation failed:', error.response?.data || error.message);
      throw new BadRequestException(error.response?.data?.message || 'Order creation failed.');
    } finally {
      await queryRunner.release();
    }
  }

  findAll(): Promise<Order[]> {
    return this.orderRepository.find({ relations: ['items'] });
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

  async updateStatus(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    order.status = updateOrderDto.status;
    // Here you could trigger events, e.g., for notifications
    // if (order.status === OrderStatus.SHIPPED) {
    //   this.messagingService.publish('order.shipped', { orderId: order.id });
    // }
    return this.orderRepository.save(order);
  }
} 