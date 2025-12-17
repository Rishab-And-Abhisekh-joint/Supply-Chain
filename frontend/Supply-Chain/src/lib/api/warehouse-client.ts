/**
 * Warehouse Service API Client
 * TypeScript client for interacting with the Warehouse Service API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ==================== ENUMS ====================

export enum PickListStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_PICKED = 'PARTIALLY_PICKED',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum PickListPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum PickListType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
  BATCH = 'BATCH',
  WAVE = 'WAVE',
}

export enum PickListItemStatus {
  PENDING = 'PENDING',
  LOCATED = 'LOCATED',
  PICKED = 'PICKED',
  VERIFIED = 'VERIFIED',
  SHORT = 'SHORT',
  DAMAGED = 'DAMAGED',
  SKIPPED = 'SKIPPED',
  SUBSTITUTED = 'SUBSTITUTED',
}

export enum ReceivingStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_QC = 'PENDING_QC',
  COMPLETED = 'COMPLETED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum ReceivingType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum ReceivingItemStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  REJECTED = 'REJECTED',
  DAMAGED = 'DAMAGED',
  QUARANTINED = 'QUARANTINED',
}

export enum ReceivingItemCondition {
  GOOD = 'GOOD',
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  WRONG_ITEM = 'WRONG_ITEM',
  MISSING = 'MISSING',
}

export enum LocationType {
  STORAGE = 'STORAGE',
  PICKING = 'PICKING',
  RECEIVING = 'RECEIVING',
  SHIPPING = 'SHIPPING',
  STAGING = 'STAGING',
  RETURNS = 'RETURNS',
  QUARANTINE = 'QUARANTINE',
}

export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FULL = 'FULL',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
}

// ==================== INTERFACES ====================

export interface PickListItem {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  productDescription?: string;
  quantityRequired: number;
  quantityPicked: number;
  quantityShort: number;
  status: PickListItemStatus;
  location: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  zone?: string;
  pickSequence?: number;
  lotNumber?: string;
  serialNumber?: string;
  expirationDate?: string;
  barcode?: string;
  unitWeight?: number;
  weightUnit?: string;
  unitPrice?: number;
  imageUrl?: string;
  pickedBy?: string;
  pickedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  substituteProductId?: string;
  substituteReason?: string;
  requiresSerialScan?: boolean;
  requiresLotTracking?: boolean;
  isHazardous?: boolean;
  isFragile?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PickList {
  id: string;
  pickListNumber: string;
  orderId: string;
  orderNumber?: string;
  status: PickListStatus;
  priority: PickListPriority;
  type: PickListType;
  assignedTo?: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  warehouseId?: string;
  zone?: string;
  totalItems: number;
  pickedItems: number;
  completionPercentage: number;
  estimatedWeight?: number;
  weightUnit?: string;
  customerName?: string;
  shippingMethod?: string;
  expectedShipDate?: string;
  isRush: boolean;
  requiresVerification: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  specialInstructions?: string;
  items: PickListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceivingItem {
  id: string;
  productId: string;
  productSku?: string;
  productName?: string;
  quantityExpected: number;
  quantityReceived: number;
  quantityRejected: number;
  quantityDamaged: number;
  status: ReceivingItemStatus;
  condition: ReceivingItemCondition;
  locationCode?: string;
  lotNumber?: string;
  serialNumber?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expirationDate?: string;
  barcode?: string;
  unitCost?: number;
  totalCost?: number;
  unitWeight?: number;
  weightUnit?: string;
  receivedBy?: string;
  receivedAt?: string;
  inspectedBy?: string;
  inspectedAt?: string;
  requiresInspection?: boolean;
  isQuarantined?: boolean;
  inspectionNotes?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceivingRecord {
  id: string;
  receivingNumber: string;
  status: ReceivingStatus;
  type: ReceivingType;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  receivingDock?: string;
  expectedDate?: string;
  receivedDate?: string;
  receivedBy?: string;
  totalItemsExpected: number;
  totalItemsReceived: number;
  totalQuantityExpected: number;
  totalQuantityReceived: number;
  carrierName?: string;
  trackingNumber?: string;
  billOfLading?: string;
  palletCount?: number;
  cartonCount?: number;
  totalWeight?: number;
  weightUnit?: string;
  requiresQualityCheck: boolean;
  qualityCheckBy?: string;
  qualityCheckDate?: string;
  qualityCheckNotes?: string;
  hasDiscrepancy: boolean;
  discrepancyNotes?: string;
  notes?: string;
  items: ReceivingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocation {
  id: string;
  locationCode: string;
  warehouseId?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  type: LocationType;
  status: LocationStatus;
  maxWeight?: number;
  weightUnit?: string;
  maxVolume?: number;
  volumeUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  currentWeight: number;
  currentVolume: number;
  currentItemCount: number;
  isTemperatureControlled: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  temperatureUnit?: string;
  isHazardous: boolean;
  isHighValue: boolean;
  pickPriority: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== DTOs ====================

export interface CreatePickListItemDto {
  productId: string;
  productSku?: string;
  productName?: string;
  quantity: number;
  unitWeight?: number;
  weightUnit?: string;
  unitPrice?: number;
  requiresSerialScan?: boolean;
  requiresLotTracking?: boolean;
}

export interface CreatePickListDto {
  orderId: string;
  orderNumber?: string;
  priority?: PickListPriority;
  type?: PickListType;
  warehouseId?: string;
  zone?: string;
  customerName?: string;
  shippingMethod?: string;
  expectedShipDate?: string;
  isRush?: boolean;
  requiresVerification?: boolean;
  notes?: string;
  specialInstructions?: string;
  items: CreatePickListItemDto[];
}

export interface UpdatePickListStatusDto {
  status: PickListStatus;
  notes?: string;
}

export interface AssignPickListDto {
  assignedTo: string;
}

export interface UpdatePickListItemDto {
  quantityPicked?: number;
  status?: PickListItemStatus;
  lotNumber?: string;
  serialNumber?: string;
  pickedBy?: string;
  substituteProductId?: string;
  substituteReason?: string;
  notes?: string;
}

export interface VerifyPickListDto {
  verifiedBy: string;
  notes?: string;
}

export interface PickListFilterDto {
  page?: number;
  limit?: number;
  status?: PickListStatus;
  priority?: PickListPriority;
  type?: PickListType;
  assignedTo?: string;
  warehouseId?: string;
  zone?: string;
  isRush?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateReceivingItemDto {
  productId: string;
  productSku?: string;
  productName?: string;
  quantityExpected: number;
  unitCost?: number;
  unitWeight?: number;
  weightUnit?: string;
  requiresInspection?: boolean;
}

export interface CreateReceivingDto {
  type?: ReceivingType;
  purchaseOrderId?: string;
  purchaseOrderNumber?: string;
  supplierId?: string;
  supplierName?: string;
  warehouseId?: string;
  receivingDock?: string;
  expectedDate?: string;
  carrierName?: string;
  trackingNumber?: string;
  billOfLading?: string;
  palletCount?: number;
  cartonCount?: number;
  totalWeight?: number;
  weightUnit?: string;
  requiresQualityCheck?: boolean;
  notes?: string;
  items: CreateReceivingItemDto[];
}

export interface UpdateReceivingStatusDto {
  status: ReceivingStatus;
  receivedBy?: string;
  notes?: string;
}

export interface ProcessReceivingItemDto {
  quantityReceived: number;
  quantityRejected?: number;
  quantityDamaged?: number;
  condition: ReceivingItemCondition;
  locationCode?: string;
  lotNumber?: string;
  serialNumber?: string;
  batchNumber?: string;
  expirationDate?: string;
  receivedBy?: string;
  notes?: string;
}

export interface QualityCheckDto {
  checkedBy: string;
  passed: boolean;
  notes?: string;
  discrepancyNotes?: string;
}

export interface ReceivingFilterDto {
  page?: number;
  limit?: number;
  status?: ReceivingStatus;
  type?: ReceivingType;
  supplierId?: string;
  warehouseId?: string;
  hasDiscrepancy?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateLocationDto {
  locationCode: string;
  warehouseId?: string;
  zone?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  type?: LocationType;
  status?: LocationStatus;
  maxWeight?: number;
  weightUnit?: string;
  maxVolume?: number;
  volumeUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  isTemperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  temperatureUnit?: string;
  isHazardous?: boolean;
  isHighValue?: boolean;
  pickPriority?: number;
}

export interface UpdateLocationDto extends Partial<CreateLocationDto> {
  currentWeight?: number;
  currentVolume?: number;
  currentItemCount?: number;
}

export interface LocationFilterDto {
  page?: number;
  limit?: number;
  type?: LocationType;
  status?: LocationStatus;
  warehouseId?: string;
  zone?: string;
  aisle?: string;
  isTemperatureControlled?: boolean;
  isHazardous?: boolean;
  hasAvailableSpace?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface PickListStats {
  byStatus: { status: PickListStatus; count: number }[];
  byPriority: { priority: PickListPriority; count: number }[];
  createdToday: number;
  pendingRush: number;
}

export interface ReceivingStats {
  byStatus: { status: ReceivingStatus; count: number }[];
  withDiscrepancies: number;
  pendingQualityCheck: number;
}

export interface LocationStats {
  byType: { type: LocationType; count: number }[];
  byStatus: { status: LocationStatus; count: number }[];
  totalLocations: number;
  fullLocations: number;
  utilizationRate: number;
}

// ==================== API CLIENT ====================

class WarehouseApiClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.NEXT_PUBLIC_WAREHOUSE_SERVICE_URL || 'http://localhost:3003',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Warehouse API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // ==================== PICKLIST METHODS ====================

  async createPickList(data: CreatePickListDto): Promise<PickList> {
    const response = await this.client.post<PickList>('/warehouse/picklists', data);
    return response.data;
  }

  async getPickLists(filters?: PickListFilterDto): Promise<PaginatedResponse<PickList>> {
    const response = await this.client.get<PaginatedResponse<PickList>>('/warehouse/picklists', {
      params: filters,
    });
    return response.data;
  }

  async getPickListStats(): Promise<PickListStats> {
    const response = await this.client.get<PickListStats>('/warehouse/picklists/stats');
    return response.data;
  }

  async getPickList(id: string): Promise<PickList> {
    const response = await this.client.get<PickList>(`/warehouse/picklists/${id}`);
    return response.data;
  }

  async getPickListByNumber(pickListNumber: string): Promise<PickList> {
    const response = await this.client.get<PickList>(`/warehouse/picklists/number/${pickListNumber}`);
    return response.data;
  }

  async getPickListsByOrder(orderId: string): Promise<PickList[]> {
    const response = await this.client.get<PickList[]>(`/warehouse/picklists/order/${orderId}`);
    return response.data;
  }

  async updatePickListStatus(id: string, data: UpdatePickListStatusDto): Promise<PickList> {
    const response = await this.client.patch<PickList>(`/warehouse/picklists/${id}/status`, data);
    return response.data;
  }

  async assignPickList(id: string, data: AssignPickListDto): Promise<PickList> {
    const response = await this.client.patch<PickList>(`/warehouse/picklists/${id}/assign`, data);
    return response.data;
  }

  async updatePickListItem(
    pickListId: string,
    itemId: string,
    data: UpdatePickListItemDto
  ): Promise<PickListItem> {
    const response = await this.client.patch<PickListItem>(
      `/warehouse/picklists/${pickListId}/items/${itemId}`,
      data
    );
    return response.data;
  }

  async verifyPickList(id: string, data: VerifyPickListDto): Promise<PickList> {
    const response = await this.client.post<PickList>(`/warehouse/picklists/${id}/verify`, data);
    return response.data;
  }

  // ==================== RECEIVING METHODS ====================

  async createReceiving(data: CreateReceivingDto): Promise<ReceivingRecord> {
    const response = await this.client.post<ReceivingRecord>('/warehouse/receiving', data);
    return response.data;
  }

  async getReceivings(filters?: ReceivingFilterDto): Promise<PaginatedResponse<ReceivingRecord>> {
    const response = await this.client.get<PaginatedResponse<ReceivingRecord>>('/warehouse/receiving', {
      params: filters,
    });
    return response.data;
  }

  async getReceivingStats(): Promise<ReceivingStats> {
    const response = await this.client.get<ReceivingStats>('/warehouse/receiving/stats');
    return response.data;
  }

  async getReceiving(id: string): Promise<ReceivingRecord> {
    const response = await this.client.get<ReceivingRecord>(`/warehouse/receiving/${id}`);
    return response.data;
  }

  async getReceivingByNumber(receivingNumber: string): Promise<ReceivingRecord> {
    const response = await this.client.get<ReceivingRecord>(
      `/warehouse/receiving/number/${receivingNumber}`
    );
    return response.data;
  }

  async updateReceivingStatus(id: string, data: UpdateReceivingStatusDto): Promise<ReceivingRecord> {
    const response = await this.client.patch<ReceivingRecord>(
      `/warehouse/receiving/${id}/status`,
      data
    );
    return response.data;
  }

  async processReceivingItem(
    receivingId: string,
    itemId: string,
    data: ProcessReceivingItemDto
  ): Promise<ReceivingItem> {
    const response = await this.client.patch<ReceivingItem>(
      `/warehouse/receiving/${receivingId}/items/${itemId}`,
      data
    );
    return response.data;
  }

  async performQualityCheck(id: string, data: QualityCheckDto): Promise<ReceivingRecord> {
    const response = await this.client.post<ReceivingRecord>(
      `/warehouse/receiving/${id}/quality-check`,
      data
    );
    return response.data;
  }

  // ==================== LOCATION METHODS ====================

  async createLocation(data: CreateLocationDto): Promise<WarehouseLocation> {
    const response = await this.client.post<WarehouseLocation>('/warehouse/locations', data);
    return response.data;
  }

  async getLocations(filters?: LocationFilterDto): Promise<PaginatedResponse<WarehouseLocation>> {
    const response = await this.client.get<PaginatedResponse<WarehouseLocation>>(
      '/warehouse/locations',
      { params: filters }
    );
    return response.data;
  }

  async getLocationStats(): Promise<LocationStats> {
    const response = await this.client.get<LocationStats>('/warehouse/locations/stats');
    return response.data;
  }

  async getLocation(id: string): Promise<WarehouseLocation> {
    const response = await this.client.get<WarehouseLocation>(`/warehouse/locations/${id}`);
    return response.data;
  }

  async getLocationByCode(code: string): Promise<WarehouseLocation> {
    const response = await this.client.get<WarehouseLocation>(`/warehouse/locations/code/${code}`);
    return response.data;
  }

  async updateLocation(id: string, data: UpdateLocationDto): Promise<WarehouseLocation> {
    const response = await this.client.patch<WarehouseLocation>(`/warehouse/locations/${id}`, data);
    return response.data;
  }

  async deleteLocation(id: string): Promise<void> {
    await this.client.delete(`/warehouse/locations/${id}`);
  }
}

// ==================== HELPER FUNCTIONS ====================

export function getPickListStatusColor(status: PickListStatus): string {
  const colors: Record<PickListStatus, string> = {
    [PickListStatus.PENDING]: 'gray',
    [PickListStatus.ASSIGNED]: 'blue',
    [PickListStatus.IN_PROGRESS]: 'yellow',
    [PickListStatus.PARTIALLY_PICKED]: 'orange',
    [PickListStatus.COMPLETED]: 'green',
    [PickListStatus.ON_HOLD]: 'red',
    [PickListStatus.CANCELLED]: 'gray',
  };
  return colors[status] || 'gray';
}

export function getPickListPriorityColor(priority: PickListPriority): string {
  const colors: Record<PickListPriority, string> = {
    [PickListPriority.LOW]: 'gray',
    [PickListPriority.NORMAL]: 'blue',
    [PickListPriority.HIGH]: 'orange',
    [PickListPriority.URGENT]: 'red',
  };
  return colors[priority] || 'gray';
}

export function getReceivingStatusColor(status: ReceivingStatus): string {
  const colors: Record<ReceivingStatus, string> = {
    [ReceivingStatus.SCHEDULED]: 'gray',
    [ReceivingStatus.IN_PROGRESS]: 'blue',
    [ReceivingStatus.PENDING_QC]: 'yellow',
    [ReceivingStatus.COMPLETED]: 'green',
    [ReceivingStatus.PARTIALLY_RECEIVED]: 'orange',
    [ReceivingStatus.ON_HOLD]: 'red',
    [ReceivingStatus.CANCELLED]: 'gray',
  };
  return colors[status] || 'gray';
}

export function getLocationStatusColor(status: LocationStatus): string {
  const colors: Record<LocationStatus, string> = {
    [LocationStatus.ACTIVE]: 'green',
    [LocationStatus.INACTIVE]: 'gray',
    [LocationStatus.FULL]: 'yellow',
    [LocationStatus.MAINTENANCE]: 'orange',
    [LocationStatus.RESERVED]: 'blue',
  };
  return colors[status] || 'gray';
}

// Export singleton instance
export const warehouseApi = new WarehouseApiClient();

export default WarehouseApiClient;
