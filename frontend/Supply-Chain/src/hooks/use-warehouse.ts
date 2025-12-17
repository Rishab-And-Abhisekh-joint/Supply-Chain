/**
 * Warehouse Service React Hooks
 * Custom hooks for interacting with the Warehouse Service API
 */

import { useState, useEffect, useCallback } from 'react';
import {
  warehouseApi,
  PickList,
  PickListItem,
  ReceivingRecord,
  ReceivingItem,
  WarehouseLocation,
  PickListFilterDto,
  ReceivingFilterDto,
  LocationFilterDto,
  CreatePickListDto,
  UpdatePickListStatusDto,
  AssignPickListDto,
  UpdatePickListItemDto,
  VerifyPickListDto,
  CreateReceivingDto,
  UpdateReceivingStatusDto,
  ProcessReceivingItemDto,
  QualityCheckDto,
  CreateLocationDto,
  UpdateLocationDto,
  PaginatedResponse,
  PickListStats,
  ReceivingStats,
  LocationStats,
} from '../lib/api/warehouse-client';

// ==================== PICKLIST HOOKS ====================

export function usePickLists(initialFilters?: PickListFilterDto) {
  const [data, setData] = useState<PaginatedResponse<PickList> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<PickListFilterDto>(initialFilters || {});

  const fetchPickLists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getPickLists(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch picklists'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPickLists();
  }, [fetchPickLists]);

  const updateFilters = useCallback((newFilters: Partial<PickListFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(() => {
    fetchPickLists();
  }, [fetchPickLists]);

  return {
    pickLists: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    loading,
    error,
    filters,
    updateFilters,
    refetch,
  };
}

export function usePickList(id: string | null) {
  const [pickList, setPickList] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPickList = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getPickList(id);
      setPickList(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch picklist'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPickList();
  }, [fetchPickList]);

  return { pickList, loading, error, refetch: fetchPickList };
}

export function usePickListStats() {
  const [stats, setStats] = useState<PickListStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getPickListStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function usePickListsByOrder(orderId: string | null) {
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPickLists = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getPickListsByOrder(orderId);
      setPickLists(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch picklists'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchPickLists();
  }, [fetchPickLists]);

  return { pickLists, loading, error, refetch: fetchPickLists };
}

export function usePickListMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPickList = useCallback(async (data: CreatePickListDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.createPickList(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create picklist');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, data: UpdatePickListStatusDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.updatePickListStatus(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update status');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const assignPickList = useCallback(async (id: string, data: AssignPickListDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.assignPickList(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to assign picklist');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateItem = useCallback(
    async (pickListId: string, itemId: string, data: UpdatePickListItemDto) => {
      try {
        setLoading(true);
        setError(null);
        const result = await warehouseApi.updatePickListItem(pickListId, itemId, data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update item');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const verifyPickList = useCallback(async (id: string, data: VerifyPickListDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.verifyPickList(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to verify picklist');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createPickList,
    updateStatus,
    assignPickList,
    updateItem,
    verifyPickList,
    loading,
    error,
  };
}

// ==================== RECEIVING HOOKS ====================

export function useReceivings(initialFilters?: ReceivingFilterDto) {
  const [data, setData] = useState<PaginatedResponse<ReceivingRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ReceivingFilterDto>(initialFilters || {});

  const fetchReceivings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getReceivings(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch receivings'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReceivings();
  }, [fetchReceivings]);

  const updateFilters = useCallback((newFilters: Partial<ReceivingFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    receivings: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 20,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchReceivings,
  };
}

export function useReceiving(id: string | null) {
  const [receiving, setReceiving] = useState<ReceivingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchReceiving = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getReceiving(id);
      setReceiving(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch receiving'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReceiving();
  }, [fetchReceiving]);

  return { receiving, loading, error, refetch: fetchReceiving };
}

export function useReceivingStats() {
  const [stats, setStats] = useState<ReceivingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getReceivingStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useReceivingMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createReceiving = useCallback(async (data: CreateReceivingDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.createReceiving(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create receiving');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, data: UpdateReceivingStatusDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.updateReceivingStatus(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update status');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const processItem = useCallback(
    async (receivingId: string, itemId: string, data: ProcessReceivingItemDto) => {
      try {
        setLoading(true);
        setError(null);
        const result = await warehouseApi.processReceivingItem(receivingId, itemId, data);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to process item');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const performQualityCheck = useCallback(async (id: string, data: QualityCheckDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.performQualityCheck(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to perform quality check');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createReceiving,
    updateStatus,
    processItem,
    performQualityCheck,
    loading,
    error,
  };
}

// ==================== LOCATION HOOKS ====================

export function useLocations(initialFilters?: LocationFilterDto) {
  const [data, setData] = useState<PaginatedResponse<WarehouseLocation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<LocationFilterDto>(initialFilters || {});

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getLocations(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch locations'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const updateFilters = useCallback((newFilters: Partial<LocationFilterDto>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    locations: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    limit: data?.limit || 50,
    loading,
    error,
    filters,
    updateFilters,
    refetch: fetchLocations,
  };
}

export function useLocation(id: string | null) {
  const [location, setLocation] = useState<WarehouseLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocation = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getLocation(id);
      setLocation(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch location'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { location, loading, error, refetch: fetchLocation };
}

export function useLocationStats() {
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.getLocationStats();
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

export function useLocationMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createLocation = useCallback(async (data: CreateLocationDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.createLocation(data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create location');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLocation = useCallback(async (id: string, data: UpdateLocationDto) => {
    try {
      setLoading(true);
      setError(null);
      const result = await warehouseApi.updateLocation(id, data);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update location');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLocation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await warehouseApi.deleteLocation(id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete location');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createLocation,
    updateLocation,
    deleteLocation,
    loading,
    error,
  };
}

// ==================== DASHBOARD HOOK ====================

export function useWarehouseDashboard() {
  const { stats: pickListStats, loading: pickListLoading } = usePickListStats();
  const { stats: receivingStats, loading: receivingLoading } = useReceivingStats();
  const { stats: locationStats, loading: locationLoading } = useLocationStats();

  return {
    pickListStats,
    receivingStats,
    locationStats,
    loading: pickListLoading || receivingLoading || locationLoading,
  };
}

export default {
  usePickLists,
  usePickList,
  usePickListStats,
  usePickListsByOrder,
  usePickListMutations,
  useReceivings,
  useReceiving,
  useReceivingStats,
  useReceivingMutations,
  useLocations,
  useLocation,
  useLocationStats,
  useLocationMutations,
  useWarehouseDashboard,
};
