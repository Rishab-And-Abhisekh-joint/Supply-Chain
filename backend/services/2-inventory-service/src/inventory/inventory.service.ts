// =============================================================================
// FILE: src/inventory/inventory.service.ts
// ACTION: MODIFY - Add reservation and movement methods
// =============================================================================

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { StockReservation, ReservationStatus } from './entities/stock-reservation.entity';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ReserveStockDto } from './dto/reserve-stock.dto';
import { ReleaseStockDto } from './dto/release-stock.dto';
import { CommitStockDto } from './dto/commit-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(StockReservation)
    private reservationRepository: Repository<StockReservation>,
    @InjectRepository(StockMovement)
    private movementRepository: Repository<StockMovement>,
  ) {}

  // === EXISTING METHODS (keep as-is with minor modifications) ===

  async findAll(params?: { locationId?: string; category?: string; search?: string }) {
    const query = this.productRepository.createQueryBuilder('product');
    
    if (params?.locationId) {
      query.andWhere('product.warehouse_id = :locationId', { locationId: params.locationId });
    }
    if (params?.category) {
      query.andWhere('product.category = :category', { category: params.category });
    }
    if (params?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${params.search}%` }
      );
    }
    
    return query.getMany();
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async create(createProductDto: CreateProductDto) {
    const product = this.productRepository.create({
      ...createProductDto,
      previousQuantity: createProductDto.quantityInStock,
      availableQuantity: createProductDto.quantityInStock,
    });
    return this.productRepository.save(product);
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);
    
    // Track previous quantity
    if (updateProductDto.quantityInStock !== undefined) {
      updateProductDto['previousQuantity'] = product.quantityInStock;
    }
    
    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return { deleted: true };
  }

  // === NEW METHODS FOR FRONTEND REQUIREMENTS ===

  /**
   * Get low stock products
   * Frontend: GET /inventory/low-stock
   */
  async getLowStock(threshold?: number) {
    const query = this.productRepository.createQueryBuilder('product')
      .where('product.available_quantity <= product.reorder_level');
    
    if (threshold) {
      query.orWhere('product.available_quantity <= :threshold', { threshold });
    }
    
    return query.getMany();
  }

  /**
   * Reserve stock for an order
   * Frontend: POST /inventory/reserve
   */
  async reserveStock(dto: ReserveStockDto) {
    const product = await this.findOne(dto.productId);
    
    if (product.availableQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.availableQuantity}, Requested: ${dto.quantity}`
      );
    }
    
    // Create reservation
    const reservation = this.reservationRepository.create({
      productId: dto.productId,
      orderId: dto.orderId,
      quantity: dto.quantity,
      reservedBy: dto.reservedBy,
      reason: dto.reason,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      status: ReservationStatus.ACTIVE,
    });
    await this.reservationRepository.save(reservation);
    
    // Update product reserved quantity
    product.reservedQuantity = (product.reservedQuantity || 0) + dto.quantity;
    await this.productRepository.save(product);
    
    // Log movement
    await this.logMovement({
      productId: dto.productId,
      quantity: dto.quantity,
      previousQuantity: product.quantityInStock,
      newQuantity: product.quantityInStock,
      movementType: MovementType.RESERVATION,
      reason: `Stock reserved for order ${dto.orderId || 'N/A'}`,
      performedBy: dto.reservedBy || 'system',
    });
    
    return { reservation, product };
  }

  /**
   * Release reserved stock
   * Frontend: POST /inventory/release
   */
  async releaseStock(dto: ReleaseStockDto) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, status: ReservationStatus.ACTIVE },
    });
    
    if (!reservation) {
      throw new NotFoundException('Active reservation not found');
    }
    
    const product = await this.findOne(reservation.productId);
    
    // Update reservation status
    reservation.status = ReservationStatus.RELEASED;
    reservation.releasedAt = new Date();
    await this.reservationRepository.save(reservation);
    
    // Update product reserved quantity
    product.reservedQuantity = Math.max(0, (product.reservedQuantity || 0) - reservation.quantity);
    await this.productRepository.save(product);
    
    return { reservation, product };
  }

  /**
   * Commit reserved stock (actual deduction)
   * Frontend: POST /inventory/commit
   */
  async commitStock(dto: CommitStockDto) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId, status: ReservationStatus.ACTIVE },
    });
    
    if (!reservation) {
      throw new NotFoundException('Active reservation not found');
    }
    
    const product = await this.findOne(reservation.productId);
    
    // Update reservation status
    reservation.status = ReservationStatus.COMMITTED;
    reservation.committedAt = new Date();
    await this.reservationRepository.save(reservation);
    
    // Deduct from actual stock
    const previousQuantity = product.quantityInStock;
    product.previousQuantity = previousQuantity;
    product.quantityInStock = Math.max(0, product.quantityInStock - reservation.quantity);
    product.reservedQuantity = Math.max(0, (product.reservedQuantity || 0) - reservation.quantity);
    await this.productRepository.save(product);
    
    // Log movement
    await this.logMovement({
      productId: reservation.productId,
      quantity: -reservation.quantity,
      previousQuantity,
      newQuantity: product.quantityInStock,
      movementType: MovementType.OUTBOUND,
      reason: `Stock committed for order ${reservation.orderId || 'N/A'}`,
      performedBy: 'system',
      reference: reservation.id,
    });
    
    return { reservation, product };
  }

  /**
   * Transfer stock between locations
   * Frontend: POST /inventory/transfer
   */
  async transferStock(dto: TransferStockDto) {
    const product = await this.findOne(dto.productId);
    
    if (product.availableQuantity < dto.quantity) {
      throw new BadRequestException('Insufficient available stock for transfer');
    }
    
    // Log the transfer movement
    await this.logMovement({
      productId: dto.productId,
      fromLocationId: dto.fromLocationId,
      toLocationId: dto.toLocationId,
      quantity: dto.quantity,
      previousQuantity: product.quantityInStock,
      newQuantity: product.quantityInStock, // Same total, different location
      movementType: MovementType.TRANSFER,
      reason: dto.reason || 'Stock transfer',
      performedBy: 'system',
    });
    
    return { success: true, message: 'Stock transfer initiated' };
  }

  /**
   * Get stock movement history
   * Frontend: GET /inventory/movements/:productId
   */
  async getMovementHistory(productId: string, locationId?: string) {
    const query = this.movementRepository.createQueryBuilder('movement')
      .where('movement.product_id = :productId', { productId })
      .orderBy('movement.created_at', 'DESC');
    
    if (locationId) {
      query.andWhere(
        '(movement.from_location_id = :locationId OR movement.to_location_id = :locationId)',
        { locationId }
      );
    }
    
    return query.getMany();
  }

  /**
   * Adjust stock (manual adjustment)
   * Frontend: POST /inventory/adjust
   */
  async adjustStock(productId: string, locationId: string, data: { quantity: number; reason: string }) {
    const product = await this.findOne(productId);
    
    const previousQuantity = product.quantityInStock;
    product.previousQuantity = previousQuantity;
    product.quantityInStock = product.quantityInStock + data.quantity;
    
    await this.productRepository.save(product);
    
    // Log movement
    await this.logMovement({
      productId,
      toLocationId: locationId,
      quantity: data.quantity,
      previousQuantity,
      newQuantity: product.quantityInStock,
      movementType: MovementType.ADJUSTMENT,
      reason: data.reason,
      performedBy: 'manual',
    });
    
    return product;
  }

  // Helper method to log movements
  private async logMovement(data: Partial<StockMovement>) {
    const movement = this.movementRepository.create(data);
    return this.movementRepository.save(movement);
  }
}