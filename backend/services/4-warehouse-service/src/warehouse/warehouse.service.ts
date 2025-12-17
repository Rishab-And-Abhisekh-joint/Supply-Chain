import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { PickList, PickListStatus, PickListPriority, PickListType } from './entities/picklist.entity';
import { PickListItem, PickListItemStatus } from './entities/picklist-item.entity';
import { ReceivingRecord, ReceivingStatus, ReceivingType } from './entities/receiving-record.entity';
import { ReceivingItem, ReceivingItemStatus, ReceivingItemCondition } from './entities/receiving-item.entity';
import { WarehouseLocation, LocationType, LocationStatus } from './entities/warehouse-location.entity';

import {
  CreatePickListDto,
  UpdatePickListStatusDto,
  AssignPickListDto,
  UpdatePickListItemDto,
  VerifyPickListDto,
  PickListFilterDto,
} from './dto/picklist.dto';

import {
  CreateReceivingDto,
  UpdateReceivingStatusDto,
  ProcessReceivingItemDto,
  QualityCheckDto,
  ReceivingFilterDto,
} from './dto/receiving.dto';

import {
  CreateLocationDto,
  UpdateLocationDto,
  LocationFilterDto,
} from './dto/location.dto';

@Injectable()
export class WarehouseService {
  private readonly logger = new Logger(WarehouseService.name);
  private readonly inventoryServiceUrl: string;
  private readonly orderServiceUrl: string;
  private readonly notificationServiceUrl: string;

  constructor(
    @InjectRepository(PickList)
    private readonly pickListRepository: Repository<PickList>,
    @InjectRepository(PickListItem)
    private readonly pickListItemRepository: Repository<PickListItem>,
    @InjectRepository(ReceivingRecord)
    private readonly receivingRepository: Repository<ReceivingRecord>,
    @InjectRepository(ReceivingItem)
    private readonly receivingItemRepository: Repository<ReceivingItem>,
    @InjectRepository(WarehouseLocation)
    private readonly locationRepository: Repository<WarehouseLocation>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.inventoryServiceUrl = this.configService.get<string>('INVENTORY_SERVICE_URL') || 'http://localhost:3001';
    this.orderServiceUrl = this.configService.get<string>('ORDER_SERVICE_URL') || 'http://localhost:3002';
    this.notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:3006';
  }

  // ==================== PICKLIST METHODS ====================

  async createPickList(dto: CreatePickListDto): Promise<PickList> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pickListNumber = this.generatePickListNumber();

      // Create picklist items with product details
      const items: Partial<PickListItem>[] = [];
      let totalWeight = 0;

      for (const itemDto of dto.items) {
        // Try to fetch product details from inventory service
        let productDetails: any = {};
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${this.inventoryServiceUrl}/products/${itemDto.productId}`)
          );
          productDetails = response.data;
        } catch (error) {
          this.logger.warn(`Could not fetch product ${itemDto.productId}: ${error.message}`);
        }

        // Find best pick location
        const location = await this.findBestPickLocation(itemDto.productId);

        items.push({
          productId: itemDto.productId,
          productSku: productDetails.sku || itemDto.productSku,
          productName: productDetails.name || itemDto.productName,
          productDescription: productDetails.description,
          quantityRequired: itemDto.quantity,
          quantityPicked: 0,
          quantityShort: 0,
          status: PickListItemStatus.PENDING,
          location: location?.locationCode || this.generateRandomLocation(),
          aisle: location?.aisle,
          rack: location?.rack,
          shelf: location?.shelf,
          bin: location?.bin,
          zone: location?.zone || dto.zone,
          pickSequence: items.length + 1,
          unitWeight: productDetails.weight || itemDto.unitWeight,
          weightUnit: itemDto.weightUnit || 'kg',
          unitPrice: productDetails.price || itemDto.unitPrice,
          imageUrl: productDetails.imageUrl,
          requiresSerialScan: itemDto.requiresSerialScan || false,
          requiresLotTracking: itemDto.requiresLotTracking || false,
          isHazardous: productDetails.isHazardous || false,
          isFragile: productDetails.isFragile || false,
        });

        if (productDetails.weight) {
          totalWeight += productDetails.weight * itemDto.quantity;
        }
      }

      const pickList = queryRunner.manager.create(PickList, {
        pickListNumber,
        orderId: dto.orderId,
        orderNumber: dto.orderNumber,
        status: PickListStatus.PENDING,
        priority: dto.priority || PickListPriority.NORMAL,
        type: dto.type || PickListType.STANDARD,
        warehouseId: dto.warehouseId,
        zone: dto.zone,
        totalItems: items.length,
        pickedItems: 0,
        completionPercentage: 0,
        estimatedWeight: totalWeight,
        weightUnit: 'kg',
        customerName: dto.customerName,
        shippingMethod: dto.shippingMethod,
        expectedShipDate: dto.expectedShipDate,
        isRush: dto.isRush || false,
        requiresVerification: dto.requiresVerification || false,
        notes: dto.notes,
        specialInstructions: dto.specialInstructions,
        items: items as PickListItem[],
      });

      const savedPickList = await queryRunner.manager.save(pickList);
      await queryRunner.commitTransaction();

      // Send notification for rush orders
      if (dto.isRush) {
        this.sendNotification('RUSH_ORDER', {
          pickListNumber,
          orderId: dto.orderId,
          message: 'Rush order picklist created',
        });
      }

      return savedPickList;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create picklist: ${error.message}`);
      throw new BadRequestException(`Failed to create picklist: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPickLists(filterDto?: PickListFilterDto): Promise<{
    data: PickList[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.pickListRepository
      .createQueryBuilder('pickList')
      .leftJoinAndSelect('pickList.items', 'items')
      .orderBy('pickList.createdAt', 'DESC');

    if (filterDto?.status) {
      queryBuilder.andWhere('pickList.status = :status', { status: filterDto.status });
    }

    if (filterDto?.priority) {
      queryBuilder.andWhere('pickList.priority = :priority', { priority: filterDto.priority });
    }

    if (filterDto?.type) {
      queryBuilder.andWhere('pickList.type = :type', { type: filterDto.type });
    }

    if (filterDto?.assignedTo) {
      queryBuilder.andWhere('pickList.assignedTo = :assignedTo', { assignedTo: filterDto.assignedTo });
    }

    if (filterDto?.warehouseId) {
      queryBuilder.andWhere('pickList.warehouseId = :warehouseId', { warehouseId: filterDto.warehouseId });
    }

    if (filterDto?.zone) {
      queryBuilder.andWhere('pickList.zone = :zone', { zone: filterDto.zone });
    }

    if (filterDto?.isRush !== undefined) {
      queryBuilder.andWhere('pickList.isRush = :isRush', { isRush: filterDto.isRush });
    }

    if (filterDto?.startDate) {
      queryBuilder.andWhere('pickList.createdAt >= :startDate', { startDate: filterDto.startDate });
    }

    if (filterDto?.endDate) {
      queryBuilder.andWhere('pickList.createdAt <= :endDate', { endDate: filterDto.endDate });
    }

    if (filterDto?.search) {
      queryBuilder.andWhere(
        '(pickList.pickListNumber ILIKE :search OR pickList.orderNumber ILIKE :search OR pickList.customerName ILIKE :search)',
        { search: `%${filterDto.search}%` }
      );
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async findPickListById(id: string): Promise<PickList> {
    const pickList = await this.pickListRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!pickList) {
      throw new NotFoundException(`PickList with ID "${id}" not found`);
    }

    return pickList;
  }

  async findPickListByNumber(pickListNumber: string): Promise<PickList> {
    const pickList = await this.pickListRepository.findOne({
      where: { pickListNumber },
      relations: ['items'],
    });

    if (!pickList) {
      throw new NotFoundException(`PickList with number "${pickListNumber}" not found`);
    }

    return pickList;
  }

  async findPickListsByOrder(orderId: string): Promise<PickList[]> {
    return this.pickListRepository.find({
      where: { orderId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePickListStatus(id: string, dto: UpdatePickListStatusDto): Promise<PickList> {
    const pickList = await this.findPickListById(id);

    // Validate status transition
    this.validateStatusTransition(pickList.status, dto.status);

    pickList.status = dto.status;

    // Update timestamps based on status
    if (dto.status === PickListStatus.IN_PROGRESS && !pickList.startedAt) {
      pickList.startedAt = new Date();
    }

    if (dto.status === PickListStatus.COMPLETED) {
      pickList.completedAt = new Date();
      pickList.completionPercentage = 100;

      // Notify order service
      this.notifyOrderService(pickList.orderId, 'PICKED');
    }

    if (dto.notes) {
      pickList.notes = dto.notes;
    }

    return this.pickListRepository.save(pickList);
  }

  async assignPickList(id: string, dto: AssignPickListDto): Promise<PickList> {
    const pickList = await this.findPickListById(id);

    if (pickList.status !== PickListStatus.PENDING && pickList.status !== PickListStatus.ASSIGNED) {
      throw new BadRequestException(`Cannot assign picklist in ${pickList.status} status`);
    }

    pickList.assignedTo = dto.assignedTo;
    pickList.assignedAt = new Date();
    pickList.status = PickListStatus.ASSIGNED;

    return this.pickListRepository.save(pickList);
  }

  async updatePickListItem(
    pickListId: string,
    itemId: string,
    dto: UpdatePickListItemDto,
  ): Promise<PickListItem> {
    const pickList = await this.findPickListById(pickListId);
    const item = pickList.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item with ID "${itemId}" not found in picklist`);
    }

    // Update item fields
    if (dto.quantityPicked !== undefined) {
      item.quantityPicked = dto.quantityPicked;
      item.quantityShort = item.quantityRequired - dto.quantityPicked;
    }

    if (dto.status) {
      item.status = dto.status;
    }

    if (dto.lotNumber) {
      item.lotNumber = dto.lotNumber;
    }

    if (dto.serialNumber) {
      item.serialNumber = dto.serialNumber;
    }

    if (dto.pickedBy) {
      item.pickedBy = dto.pickedBy;
      item.pickedAt = new Date();
    }

    if (dto.substituteProductId) {
      item.substituteProductId = dto.substituteProductId;
      item.substituteReason = dto.substituteReason;
      item.status = PickListItemStatus.SUBSTITUTED;
    }

    if (dto.notes) {
      item.notes = dto.notes;
    }

    await this.pickListItemRepository.save(item);

    // Update picklist progress
    await this.updatePickListProgress(pickList);

    return item;
  }

  async verifyPickList(id: string, dto: VerifyPickListDto): Promise<PickList> {
    const pickList = await this.findPickListById(id);

    if (pickList.status !== PickListStatus.COMPLETED) {
      throw new BadRequestException('Can only verify completed picklists');
    }

    pickList.verifiedBy = dto.verifiedBy;
    pickList.verifiedAt = new Date();

    // Update all items to verified status
    for (const item of pickList.items) {
      if (item.status === PickListItemStatus.PICKED) {
        item.status = PickListItemStatus.VERIFIED;
        item.verifiedBy = dto.verifiedBy;
        item.verifiedAt = new Date();
      }
    }

    await this.pickListItemRepository.save(pickList.items);

    if (dto.notes) {
      pickList.notes = (pickList.notes || '') + `\nVerification: ${dto.notes}`;
    }

    return this.pickListRepository.save(pickList);
  }

  async getPickListStats(): Promise<any> {
    const stats = await this.pickListRepository
      .createQueryBuilder('pickList')
      .select('pickList.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('pickList.status')
      .getRawMany();

    const priorityStats = await this.pickListRepository
      .createQueryBuilder('pickList')
      .select('pickList.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('pickList.status NOT IN (:...statuses)', {
        statuses: [PickListStatus.COMPLETED, PickListStatus.CANCELLED],
      })
      .groupBy('pickList.priority')
      .getRawMany();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCount = await this.pickListRepository.count({
      where: {
        createdAt: new Date(today),
      },
    });

    const rushCount = await this.pickListRepository.count({
      where: {
        isRush: true,
        status: PickListStatus.PENDING,
      },
    });

    return {
      byStatus: stats,
      byPriority: priorityStats,
      createdToday: todayCount,
      pendingRush: rushCount,
    };
  }

  // ==================== RECEIVING METHODS ====================

  async createReceiving(dto: CreateReceivingDto): Promise<ReceivingRecord> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const receivingNumber = this.generateReceivingNumber();

      const items: Partial<ReceivingItem>[] = dto.items.map((itemDto, index) => ({
        productId: itemDto.productId,
        productSku: itemDto.productSku,
        productName: itemDto.productName,
        quantityExpected: itemDto.quantityExpected,
        quantityReceived: 0,
        quantityRejected: 0,
        quantityDamaged: 0,
        status: ReceivingItemStatus.PENDING,
        condition: ReceivingItemCondition.GOOD,
        unitCost: itemDto.unitCost,
        totalCost: itemDto.unitCost ? itemDto.unitCost * itemDto.quantityExpected : null,
        unitWeight: itemDto.unitWeight,
        weightUnit: itemDto.weightUnit || 'kg',
        requiresInspection: itemDto.requiresInspection || false,
        isQuarantined: false,
      }));

      const totalQuantityExpected = items.reduce((sum, item) => sum + (item.quantityExpected || 0), 0);

      const receiving = queryRunner.manager.create(ReceivingRecord, {
        receivingNumber,
        status: ReceivingStatus.SCHEDULED,
        type: dto.type || ReceivingType.PURCHASE_ORDER,
        purchaseOrderId: dto.purchaseOrderId,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        supplierId: dto.supplierId,
        supplierName: dto.supplierName,
        warehouseId: dto.warehouseId,
        receivingDock: dto.receivingDock,
        expectedDate: dto.expectedDate,
        totalItemsExpected: items.length,
        totalItemsReceived: 0,
        totalQuantityExpected,
        totalQuantityReceived: 0,
        carrierName: dto.carrierName,
        trackingNumber: dto.trackingNumber,
        billOfLading: dto.billOfLading,
        palletCount: dto.palletCount,
        cartonCount: dto.cartonCount,
        totalWeight: dto.totalWeight,
        weightUnit: dto.weightUnit || 'kg',
        requiresQualityCheck: dto.requiresQualityCheck || false,
        hasDiscrepancy: false,
        notes: dto.notes,
        items: items as ReceivingItem[],
      });

      const savedReceiving = await queryRunner.manager.save(receiving);
      await queryRunner.commitTransaction();

      return savedReceiving;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create receiving: ${error.message}`);
      throw new BadRequestException(`Failed to create receiving: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async findAllReceivings(filterDto?: ReceivingFilterDto): Promise<{
    data: ReceivingRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.receivingRepository
      .createQueryBuilder('receiving')
      .leftJoinAndSelect('receiving.items', 'items')
      .orderBy('receiving.createdAt', 'DESC');

    if (filterDto?.status) {
      queryBuilder.andWhere('receiving.status = :status', { status: filterDto.status });
    }

    if (filterDto?.type) {
      queryBuilder.andWhere('receiving.type = :type', { type: filterDto.type });
    }

    if (filterDto?.supplierId) {
      queryBuilder.andWhere('receiving.supplierId = :supplierId', { supplierId: filterDto.supplierId });
    }

    if (filterDto?.warehouseId) {
      queryBuilder.andWhere('receiving.warehouseId = :warehouseId', { warehouseId: filterDto.warehouseId });
    }

    if (filterDto?.hasDiscrepancy !== undefined) {
      queryBuilder.andWhere('receiving.hasDiscrepancy = :hasDiscrepancy', { hasDiscrepancy: filterDto.hasDiscrepancy });
    }

    if (filterDto?.startDate) {
      queryBuilder.andWhere('receiving.createdAt >= :startDate', { startDate: filterDto.startDate });
    }

    if (filterDto?.endDate) {
      queryBuilder.andWhere('receiving.createdAt <= :endDate', { endDate: filterDto.endDate });
    }

    if (filterDto?.search) {
      queryBuilder.andWhere(
        '(receiving.receivingNumber ILIKE :search OR receiving.purchaseOrderNumber ILIKE :search OR receiving.supplierName ILIKE :search)',
        { search: `%${filterDto.search}%` }
      );
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async findReceivingById(id: string): Promise<ReceivingRecord> {
    const receiving = await this.receivingRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!receiving) {
      throw new NotFoundException(`Receiving record with ID "${id}" not found`);
    }

    return receiving;
  }

  async findReceivingByNumber(receivingNumber: string): Promise<ReceivingRecord> {
    const receiving = await this.receivingRepository.findOne({
      where: { receivingNumber },
      relations: ['items'],
    });

    if (!receiving) {
      throw new NotFoundException(`Receiving record with number "${receivingNumber}" not found`);
    }

    return receiving;
  }

  async updateReceivingStatus(id: string, dto: UpdateReceivingStatusDto): Promise<ReceivingRecord> {
    const receiving = await this.findReceivingById(id);

    receiving.status = dto.status;

    if (dto.status === ReceivingStatus.IN_PROGRESS && !receiving.receivedDate) {
      receiving.receivedDate = new Date();
    }

    if (dto.status === ReceivingStatus.COMPLETED) {
      // Update inventory for all received items
      await this.updateInventoryFromReceiving(receiving);
    }

    if (dto.receivedBy) {
      receiving.receivedBy = dto.receivedBy;
    }

    if (dto.notes) {
      receiving.notes = dto.notes;
    }

    return this.receivingRepository.save(receiving);
  }

  async processReceivingItem(
    receivingId: string,
    itemId: string,
    dto: ProcessReceivingItemDto,
  ): Promise<ReceivingItem> {
    const receiving = await this.findReceivingById(receivingId);
    const item = receiving.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException(`Item with ID "${itemId}" not found in receiving record`);
    }

    item.quantityReceived = dto.quantityReceived;
    item.quantityRejected = dto.quantityRejected || 0;
    item.quantityDamaged = dto.quantityDamaged || 0;
    item.condition = dto.condition;
    item.status = ReceivingItemStatus.RECEIVED;

    if (dto.locationCode) {
      item.locationCode = dto.locationCode;
    }

    if (dto.lotNumber) {
      item.lotNumber = dto.lotNumber;
    }

    if (dto.serialNumber) {
      item.serialNumber = dto.serialNumber;
    }

    if (dto.batchNumber) {
      item.batchNumber = dto.batchNumber;
    }

    if (dto.expirationDate) {
      item.expirationDate = dto.expirationDate;
    }

    if (dto.receivedBy) {
      item.receivedBy = dto.receivedBy;
      item.receivedAt = new Date();
    }

    if (dto.notes) {
      item.notes = dto.notes;
    }

    // Check for discrepancy
    if (item.quantityReceived !== item.quantityExpected) {
      receiving.hasDiscrepancy = true;
    }

    // Quarantine if damaged or rejected
    if (item.quantityDamaged > 0 || item.quantityRejected > 0) {
      item.isQuarantined = true;
    }

    await this.receivingItemRepository.save(item);

    // Update receiving totals
    await this.updateReceivingTotals(receiving);

    return item;
  }

  async performQualityCheck(id: string, dto: QualityCheckDto): Promise<ReceivingRecord> {
    const receiving = await this.findReceivingById(id);

    if (!receiving.requiresQualityCheck) {
      throw new BadRequestException('This receiving does not require quality check');
    }

    receiving.qualityCheckBy = dto.checkedBy;
    receiving.qualityCheckDate = new Date();
    receiving.qualityCheckNotes = dto.notes;

    if (dto.passed) {
      receiving.status = ReceivingStatus.COMPLETED;
    } else {
      receiving.status = ReceivingStatus.ON_HOLD;
      receiving.discrepancyNotes = dto.discrepancyNotes;
      receiving.hasDiscrepancy = true;
    }

    return this.receivingRepository.save(receiving);
  }

  async getReceivingStats(): Promise<any> {
    const stats = await this.receivingRepository
      .createQueryBuilder('receiving')
      .select('receiving.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('receiving.status')
      .getRawMany();

    const discrepancyCount = await this.receivingRepository.count({
      where: { hasDiscrepancy: true },
    });

    const pendingQC = await this.receivingRepository.count({
      where: {
        requiresQualityCheck: true,
        status: ReceivingStatus.PENDING_QC,
      },
    });

    return {
      byStatus: stats,
      withDiscrepancies: discrepancyCount,
      pendingQualityCheck: pendingQC,
    };
  }

  // ==================== LOCATION METHODS ====================

  async createLocation(dto: CreateLocationDto): Promise<WarehouseLocation> {
    // Check for duplicate location code
    const existing = await this.locationRepository.findOne({
      where: { locationCode: dto.locationCode },
    });

    if (existing) {
      throw new BadRequestException(`Location with code "${dto.locationCode}" already exists`);
    }

    const location = this.locationRepository.create({
      ...dto,
      currentWeight: 0,
      currentVolume: 0,
      currentItemCount: 0,
    });

    return this.locationRepository.save(location);
  }

  async findAllLocations(filterDto?: LocationFilterDto): Promise<{
    data: WarehouseLocation[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.locationRepository
      .createQueryBuilder('location')
      .orderBy('location.locationCode', 'ASC');

    if (filterDto?.type) {
      queryBuilder.andWhere('location.type = :type', { type: filterDto.type });
    }

    if (filterDto?.status) {
      queryBuilder.andWhere('location.status = :status', { status: filterDto.status });
    }

    if (filterDto?.warehouseId) {
      queryBuilder.andWhere('location.warehouseId = :warehouseId', { warehouseId: filterDto.warehouseId });
    }

    if (filterDto?.zone) {
      queryBuilder.andWhere('location.zone = :zone', { zone: filterDto.zone });
    }

    if (filterDto?.aisle) {
      queryBuilder.andWhere('location.aisle = :aisle', { aisle: filterDto.aisle });
    }

    if (filterDto?.isTemperatureControlled !== undefined) {
      queryBuilder.andWhere('location.isTemperatureControlled = :tempControlled', {
        tempControlled: filterDto.isTemperatureControlled,
      });
    }

    if (filterDto?.isHazardous !== undefined) {
      queryBuilder.andWhere('location.isHazardous = :hazardous', {
        hazardous: filterDto.isHazardous,
      });
    }

    if (filterDto?.hasAvailableSpace) {
      queryBuilder.andWhere('location.currentWeight < location.maxWeight');
    }

    const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async findLocationById(id: string): Promise<WarehouseLocation> {
    const location = await this.locationRepository.findOne({ where: { id } });

    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }

    return location;
  }

  async findLocationByCode(locationCode: string): Promise<WarehouseLocation> {
    const location = await this.locationRepository.findOne({ where: { locationCode } });

    if (!location) {
      throw new NotFoundException(`Location with code "${locationCode}" not found`);
    }

    return location;
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<WarehouseLocation> {
    const location = await this.findLocationById(id);

    Object.assign(location, dto);

    return this.locationRepository.save(location);
  }

  async deleteLocation(id: string): Promise<void> {
    const location = await this.findLocationById(id);

    if (location.currentItemCount > 0) {
      throw new BadRequestException('Cannot delete location with items');
    }

    await this.locationRepository.remove(location);
  }

  async getLocationStats(): Promise<any> {
    const byType = await this.locationRepository
      .createQueryBuilder('location')
      .select('location.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('location.type')
      .getRawMany();

    const byStatus = await this.locationRepository
      .createQueryBuilder('location')
      .select('location.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('location.status')
      .getRawMany();

    const totalLocations = await this.locationRepository.count();

    const fullLocations = await this.locationRepository.count({
      where: { status: LocationStatus.FULL },
    });

    return {
      byType,
      byStatus,
      totalLocations,
      fullLocations,
      utilizationRate: totalLocations > 0 ? ((fullLocations / totalLocations) * 100).toFixed(2) : 0,
    };
  }

  // ==================== HELPER METHODS ====================

  private generatePickListNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `PL-${year}-${random}`;
  }

  private generateReceivingNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `RCV-${year}-${random}`;
  }

  private async updatePickListProgress(pickList: PickList): Promise<void> {
    const pickedCount = pickList.items.filter(
      (item) =>
        item.status === PickListItemStatus.PICKED ||
        item.status === PickListItemStatus.VERIFIED ||
        item.status === PickListItemStatus.SUBSTITUTED
    ).length;

    pickList.pickedItems = pickedCount;
    pickList.completionPercentage = pickList.totalItems > 0
      ? Number(((pickedCount / pickList.totalItems) * 100).toFixed(2))
      : 0;

    // Auto-update status based on progress
    if (pickedCount === pickList.totalItems && pickList.status !== PickListStatus.COMPLETED) {
      pickList.status = PickListStatus.COMPLETED;
      pickList.completedAt = new Date();
    } else if (pickedCount > 0 && pickedCount < pickList.totalItems) {
      pickList.status = PickListStatus.PARTIALLY_PICKED;
    }

    await this.pickListRepository.save(pickList);
  }

  private validateStatusTransition(currentStatus: PickListStatus, newStatus: PickListStatus): void {
    const validTransitions: Record<PickListStatus, PickListStatus[]> = {
      [PickListStatus.PENDING]: [PickListStatus.ASSIGNED, PickListStatus.IN_PROGRESS, PickListStatus.CANCELLED],
      [PickListStatus.ASSIGNED]: [PickListStatus.IN_PROGRESS, PickListStatus.PENDING, PickListStatus.CANCELLED],
      [PickListStatus.IN_PROGRESS]: [
        PickListStatus.PARTIALLY_PICKED,
        PickListStatus.COMPLETED,
        PickListStatus.ON_HOLD,
        PickListStatus.CANCELLED,
      ],
      [PickListStatus.PARTIALLY_PICKED]: [
        PickListStatus.IN_PROGRESS,
        PickListStatus.COMPLETED,
        PickListStatus.ON_HOLD,
      ],
      [PickListStatus.ON_HOLD]: [PickListStatus.IN_PROGRESS, PickListStatus.CANCELLED],
      [PickListStatus.COMPLETED]: [],
      [PickListStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  private async updateReceivingTotals(receiving: ReceivingRecord): Promise<void> {
    const receivedItems = receiving.items.filter(
      (item) => item.status === ReceivingItemStatus.RECEIVED
    ).length;

    const totalReceived = receiving.items.reduce(
      (sum, item) => sum + (item.quantityReceived || 0),
      0
    );

    receiving.totalItemsReceived = receivedItems;
    receiving.totalQuantityReceived = totalReceived;

    // Check if all items are received
    if (receivedItems === receiving.totalItemsExpected) {
      if (receiving.requiresQualityCheck) {
        receiving.status = ReceivingStatus.PENDING_QC;
      } else {
        receiving.status = ReceivingStatus.COMPLETED;
      }
    } else if (receivedItems > 0) {
      receiving.status = ReceivingStatus.PARTIALLY_RECEIVED;
    }

    await this.receivingRepository.save(receiving);
  }

  private async updateInventoryFromReceiving(receiving: ReceivingRecord): Promise<void> {
    for (const item of receiving.items) {
      if (item.quantityReceived > 0) {
        try {
          await firstValueFrom(
            this.httpService.patch(
              `${this.inventoryServiceUrl}/products/stock/${item.productId}`,
              { quantity: item.quantityReceived }
            )
          );
        } catch (error) {
          this.logger.error(
            `Failed to update inventory for product ${item.productId}: ${error.message}`
          );
        }
      }
    }
  }

  private async findBestPickLocation(productId: string): Promise<WarehouseLocation | null> {
    // Find locations with this product, sorted by pick priority
    const location = await this.locationRepository.findOne({
      where: {
        type: LocationType.PICKING,
        status: LocationStatus.ACTIVE,
      },
      order: { pickPriority: 'ASC' },
    });

    return location;
  }

  private generateRandomLocation(): string {
    const aisle = String.fromCharCode(65 + Math.floor(Math.random() * 10));
    const rack = Math.floor(Math.random() * 20) + 1;
    const shelf = String.fromCharCode(65 + Math.floor(Math.random() * 5));
    const bin = Math.floor(Math.random() * 10) + 1;
    return `${aisle}-${rack.toString().padStart(2, '0')}-${shelf}-${bin.toString().padStart(2, '0')}`;
  }

  private async notifyOrderService(orderId: string, status: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.patch(`${this.orderServiceUrl}/orders/${orderId}/warehouse-status`, {
          warehouseStatus: status,
        })
      );
    } catch (error) {
      this.logger.warn(`Failed to notify order service: ${error.message}`);
    }
  }

  private async sendNotification(type: string, data: any): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(`${this.notificationServiceUrl}/notifications/send`, {
          type,
          channel: 'INTERNAL',
          data,
        })
      );
    } catch (error) {
      this.logger.warn(`Failed to send notification: ${error.message}`);
    }
  }
}
