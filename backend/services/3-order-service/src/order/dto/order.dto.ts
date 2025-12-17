import {
    IsArray,
    IsNotEmpty,
    IsString,
    IsUUID,
    IsNumber,
    IsOptional,
    IsEnum,
    IsBoolean,
    IsEmail,
    Min,
    ValidateNested,
    IsDateString,
  } from 'class-validator';
  import { Type } from 'class-transformer';
  import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
  import { OrderStatus, PaymentStatus, DeliveryType } from '../entities/order.entity';
  import { OrderItemStatus } from '../entities/order-item.entity';
  
  // ============ ORDER ITEM DTOs ============
  
  export class CreateOrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ description: 'The UUID of the product to order' })
    productId: string;
  
    @IsNumber()
    @Min(1)
    @ApiProperty({ description: 'Quantity to order', minimum: 1 })
    quantity: number;
  
    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional({ description: 'Unit price (if not fetched from inventory)' })
    unitPrice?: number;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Product name (if not fetched from inventory)' })
    productName?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Product SKU' })
    productSku?: string;
  
    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional({ description: 'Discount for this item' })
    discount?: number;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Notes for this item' })
    notes?: string;
  }
  
  export class UpdateOrderItemDto {
    @IsOptional()
    @IsNumber()
    @Min(1)
    @ApiPropertyOptional({ description: 'Updated quantity' })
    quantity?: number;
  
    @IsOptional()
    @IsNumber()
    @ApiPropertyOptional({ description: 'Updated discount' })
    discount?: number;
  
    @IsOptional()
    @IsEnum(OrderItemStatus)
    @ApiPropertyOptional({ enum: OrderItemStatus, description: 'Updated status' })
    status?: OrderItemStatus;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  }
  
  // ============ ORDER DTOs ============
  
  export class CreateOrderDto {
    @IsOptional()
    @IsUUID()
    @ApiPropertyOptional({ description: 'Customer ID (if not from auth context)' })
    customerId?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Customer name' })
    customerName?: string;
  
    @IsOptional()
    @IsEmail()
    @ApiPropertyOptional({ description: 'Customer email' })
    customerEmail?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Customer phone' })
    customerPhone?: string;
  
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Shipping address' })
    shippingAddress: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping city' })
    shippingCity?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping state/province' })
    shippingState?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping country' })
    shippingCountry?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping postal/ZIP code' })
    shippingZipCode?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Billing address (if different)' })
    billingAddress?: string;
  
    @IsOptional()
    @IsEnum(DeliveryType)
    @ApiPropertyOptional({ enum: DeliveryType, description: 'Delivery type' })
    deliveryType?: DeliveryType;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Special instructions or notes' })
    notes?: string;
  
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Is this a priority order?' })
    isPriority?: boolean;
  
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Is this a gift?' })
    isGift?: boolean;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Gift message' })
    giftMessage?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Payment method' })
    paymentMethod?: string;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    @ApiProperty({ type: [CreateOrderItemDto], description: 'Order items' })
    items: CreateOrderItemDto[];
  }
  
  export class UpdateOrderDto {
    @IsOptional()
    @IsEnum(OrderStatus)
    @ApiPropertyOptional({ enum: OrderStatus, description: 'Order status' })
    status?: OrderStatus;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping address' })
    shippingAddress?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping city' })
    shippingCity?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping state' })
    shippingState?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping country' })
    shippingCountry?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Shipping ZIP code' })
    shippingZipCode?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Notes' })
    notes?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Internal notes' })
    internalNotes?: string;
  
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Priority flag' })
    isPriority?: boolean;
  
    @IsOptional()
    @IsDateString()
    @ApiPropertyOptional({ description: 'Expected delivery date' })
    expectedDeliveryDate?: string;
  }
  
  export class UpdateOrderStatusDto {
    @IsEnum(OrderStatus)
    @IsNotEmpty()
    @ApiProperty({ enum: OrderStatus, description: 'New order status' })
    status: OrderStatus;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Reason for status change' })
    reason?: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Internal notes' })
    internalNotes?: string;
  }
  
  export class CancelOrderDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Reason for cancellation' })
    reason: string;
  
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Whether to refund if paid' })
    refund?: boolean;
  
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional({ description: 'Whether to restock items' })
    restockItems?: boolean;
  }
  
  export class ProcessPaymentDto {
    @IsNumber()
    @Min(0.01)
    @ApiProperty({ description: 'Amount to process' })
    amount: number;
  
    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Payment method' })
    paymentMethod: string;
  
    @IsOptional()
    @IsString()
    @ApiPropertyOptional({ description: 'Payment reference/transaction ID' })
    paymentReference?: string;
  }
  
  export class AssignWarehouseDto {
    @IsUUID()
    @IsNotEmpty()
    @ApiProperty({ description: 'Warehouse ID to assign' })
    warehouseId: string;
  }
  
  export class OrderFilterDto {
    @IsOptional()
    @IsEnum(OrderStatus)
    @ApiPropertyOptional({ enum: OrderStatus })
    status?: OrderStatus;
  
    @IsOptional()
    @IsEnum(PaymentStatus)
    @ApiPropertyOptional({ enum: PaymentStatus })
    paymentStatus?: PaymentStatus;
  
    @IsOptional()
    @IsUUID()
    @ApiPropertyOptional()
    customerId?: string;
  
    @IsOptional()
    @IsDateString()
    @ApiPropertyOptional()
    startDate?: string;
  
    @IsOptional()
    @IsDateString()
    @ApiPropertyOptional()
    endDate?: string;
  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiPropertyOptional({ default: 1 })
    page?: number;
  
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @ApiPropertyOptional({ default: 20 })
    limit?: number;
  }
  
  // ============ RESPONSE DTOs ============
  
  export class OrderStatsDto {
    @ApiProperty()
    totalOrders: number;
  
    @ApiProperty()
    pendingOrders: number;
  
    @ApiProperty()
    processingOrders: number;
  
    @ApiProperty()
    shippedOrders: number;
  
    @ApiProperty()
    deliveredOrders: number;
  
    @ApiProperty()
    cancelledOrders: number;
  
    @ApiProperty()
    totalRevenue: number;
  
    @ApiProperty()
    todayOrders: number;
  
    @ApiProperty()
    todayRevenue: number;
  }
  
  export class PaginatedOrdersDto {
    @ApiProperty({ type: [Object] })
    data: any[];
  
    @ApiProperty()
    total: number;
  
    @ApiProperty()
    page: number;
  
    @ApiProperty()
    limit: number;
  
    @ApiProperty()
    totalPages: number;
  }