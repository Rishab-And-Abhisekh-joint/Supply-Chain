/**
 * Supply Chain Data Service
 * 
 * This service handles data loading from multiple sources:
 * 1. Local JSON files (place in /public/data/)
 * 2. AWS S3 buckets
 * 3. REST APIs
 * 4. Demo data (fallback)
 * 
 * USAGE:
 * ------
 * Option 1: Local JSON Files
 *   - Create folder: /public/data/
 *   - Add files: inventory.json, orders.json, vehicles.json, warehouses.json, etc.
 *   - Data will auto-load from these files
 * 
 * Option 2: AWS S3
 *   - Set environment variables in .env.local:
 *     NEXT_PUBLIC_AWS_REGION=ap-south-1
 *     NEXT_PUBLIC_S3_BUCKET=your-bucket-name
 *     NEXT_PUBLIC_AWS_ACCESS_KEY=your-access-key
 *     NEXT_PUBLIC_AWS_SECRET_KEY=your-secret-key
 *   - Files should be in S3: s3://bucket/data/inventory.json, etc.
 * 
 * Option 3: REST API
 *   - Set: NEXT_PUBLIC_API_URL=https://your-api.com
 *   - Endpoints: /api/inventory, /api/orders, etc.
 */

// Types
export interface InventoryItem {
    id: string;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    minStock: number;
    maxStock: number;
    unitPrice: number;
    warehouse: string;
    lastUpdated: string;
    status: 'in-stock' | 'low-stock' | 'out-of-stock';
  }
  
  export interface Order {
    id: string;
    orderNumber: string;
    customer: string;
    items: { sku: string; name: string; quantity: number; price: number }[];
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    createdAt: string;
    deliveryDate: string;
    address: string;
  }
  
  export interface Vehicle {
    id: string;
    vehicleNumber: string;
    type: 'truck' | 'van' | 'bike';
    driver: string;
    status: 'moving' | 'delivering' | 'idle' | 'maintenance';
    currentLocation: { lat: number; lng: number };
    destination?: string;
    capacity: number;
    currentLoad: number;
  }
  
  export interface Warehouse {
    id: string;
    name: string;
    code: string;
    address: string;
    city: string;
    capacity: number;
    currentStock: number;
    manager: string;
    contact: string;
  }
  
  export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar?: string;
    status: 'active' | 'inactive' | 'on-leave';
    joinDate: string;
  }
  
  export interface Alert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    category: 'inventory' | 'delivery' | 'system' | 'order';
  }
  
  // Data source configuration
  type DataSource = 'local' | 's3' | 'api' | 'demo';
  
  const getDataSource = (): DataSource => {
    if (process.env.NEXT_PUBLIC_S3_BUCKET) return 's3';
    if (process.env.NEXT_PUBLIC_API_URL) return 'api';
    return 'local'; // Will fallback to demo if local files don't exist
  };
  
  // S3 fetcher (requires AWS SDK setup)
  const fetchFromS3 = async (key: string): Promise<any> => {
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'ap-south-1';
    
    // Using public S3 URL (for public buckets) or signed URLs
    const url = `https://${bucket}.s3.${region}.amazonaws.com/data/${key}.json`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`S3 fetch failed: ${key}`);
    return response.json();
  };
  
  // Local JSON fetcher
  const fetchFromLocal = async (key: string): Promise<any> => {
    const response = await fetch(`/data/${key}.json`);
    if (!response.ok) throw new Error(`Local fetch failed: ${key}`);
    return response.json();
  };
  
  // API fetcher
  const fetchFromAPI = async (endpoint: string): Promise<any> => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    const response = await fetch(`${baseUrl}/api/${endpoint}`);
    if (!response.ok) throw new Error(`API fetch failed: ${endpoint}`);
    return response.json();
  };
  
  // Generic data fetcher with fallback to demo data
  const fetchData = async <T>(key: string, demoData: T): Promise<T> => {
    const source = getDataSource();
    
    try {
      switch (source) {
        case 's3':
          return await fetchFromS3(key);
        case 'api':
          return await fetchFromAPI(key);
        case 'local':
          return await fetchFromLocal(key);
        default:
          return demoData;
      }
    } catch (error) {
      console.log(`Using demo data for ${key}:`, error);
      return demoData;
    }
  };
  
  // ==================== DEMO DATA ====================
  
  const demoInventory: InventoryItem[] = [
    { id: '1', sku: 'SKU001', name: 'Organic Wheat Flour', category: 'Grains', quantity: 2500, minStock: 500, maxStock: 5000, unitPrice: 45, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-18', status: 'in-stock' },
    { id: '2', sku: 'SKU002', name: 'Basmati Rice Premium', category: 'Grains', quantity: 1800, minStock: 400, maxStock: 4000, unitPrice: 85, warehouse: 'Noida Warehouse', lastUpdated: '2024-12-18', status: 'in-stock' },
    { id: '3', sku: 'SKU003', name: 'Refined Sunflower Oil', category: 'Oils', quantity: 320, minStock: 300, maxStock: 2000, unitPrice: 180, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-17', status: 'low-stock' },
    { id: '4', sku: 'SKU004', name: 'Toor Dal', category: 'Pulses', quantity: 950, minStock: 200, maxStock: 2500, unitPrice: 120, warehouse: 'Gurgaon Depot', lastUpdated: '2024-12-18', status: 'in-stock' },
    { id: '5', sku: 'SKU005', name: 'Sugar (White)', category: 'Sweeteners', quantity: 0, minStock: 500, maxStock: 3000, unitPrice: 42, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-16', status: 'out-of-stock' },
    { id: '6', sku: 'SKU006', name: 'Masoor Dal', category: 'Pulses', quantity: 1200, minStock: 300, maxStock: 2000, unitPrice: 95, warehouse: 'Noida Warehouse', lastUpdated: '2024-12-18', status: 'in-stock' },
    { id: '7', sku: 'SKU007', name: 'Mustard Oil', category: 'Oils', quantity: 450, minStock: 200, maxStock: 1500, unitPrice: 165, warehouse: 'Gurgaon Depot', lastUpdated: '2024-12-17', status: 'in-stock' },
    { id: '8', sku: 'SKU008', name: 'Chickpeas (Kabuli)', category: 'Pulses', quantity: 180, minStock: 200, maxStock: 1000, unitPrice: 110, warehouse: 'Delhi Central Hub', lastUpdated: '2024-12-18', status: 'low-stock' },
  ];
  
  const demoOrders: Order[] = [
    { id: '1', orderNumber: 'ORD-2024-001', customer: 'Reliance Fresh', items: [{ sku: 'SKU001', name: 'Organic Wheat Flour', quantity: 100, price: 4500 }], total: 4500, status: 'delivered', createdAt: '2024-12-15', deliveryDate: '2024-12-17', address: 'Mumbai, Maharashtra' },
    { id: '2', orderNumber: 'ORD-2024-002', customer: 'BigBasket', items: [{ sku: 'SKU002', name: 'Basmati Rice Premium', quantity: 200, price: 17000 }], total: 17000, status: 'shipped', createdAt: '2024-12-16', deliveryDate: '2024-12-19', address: 'Bangalore, Karnataka' },
    { id: '3', orderNumber: 'ORD-2024-003', customer: 'DMart', items: [{ sku: 'SKU003', name: 'Refined Sunflower Oil', quantity: 50, price: 9000 }, { sku: 'SKU004', name: 'Toor Dal', quantity: 80, price: 9600 }], total: 18600, status: 'processing', createdAt: '2024-12-17', deliveryDate: '2024-12-20', address: 'Pune, Maharashtra' },
    { id: '4', orderNumber: 'ORD-2024-004', customer: 'Spencer\'s', items: [{ sku: 'SKU006', name: 'Masoor Dal', quantity: 150, price: 14250 }], total: 14250, status: 'pending', createdAt: '2024-12-18', deliveryDate: '2024-12-21', address: 'Kolkata, West Bengal' },
    { id: '5', orderNumber: 'ORD-2024-005', customer: 'More Supermarket', items: [{ sku: 'SKU007', name: 'Mustard Oil', quantity: 75, price: 12375 }], total: 12375, status: 'processing', createdAt: '2024-12-18', deliveryDate: '2024-12-22', address: 'Chennai, Tamil Nadu' },
  ];
  
  const demoVehicles: Vehicle[] = [
    { id: '1', vehicleNumber: 'DL01AB1234', type: 'truck', driver: 'Rajesh Kumar', status: 'moving', currentLocation: { lat: 28.6139, lng: 77.2090 }, destination: 'Mumbai', capacity: 10000, currentLoad: 7500 },
    { id: '2', vehicleNumber: 'DL02CD5678', type: 'truck', driver: 'Amit Singh', status: 'delivering', currentLocation: { lat: 28.5355, lng: 77.3910 }, destination: 'Noida', capacity: 8000, currentLoad: 6000 },
    { id: '3', vehicleNumber: 'HR03EF9012', type: 'van', driver: 'Suresh Yadav', status: 'idle', currentLocation: { lat: 28.4595, lng: 77.0266 }, capacity: 3000, currentLoad: 0 },
    { id: '4', vehicleNumber: 'DL04GH3456', type: 'truck', driver: 'Vikram Sharma', status: 'moving', currentLocation: { lat: 28.7041, lng: 77.1025 }, destination: 'Gurgaon', capacity: 10000, currentLoad: 8500 },
    { id: '5', vehicleNumber: 'UP05IJ7890', type: 'van', driver: 'Prakash Verma', status: 'maintenance', currentLocation: { lat: 28.6692, lng: 77.4538 }, capacity: 3000, currentLoad: 0 },
  ];
  
  const demoWarehouses: Warehouse[] = [
    { id: '1', name: 'Delhi Central Hub', code: 'W001', address: 'Industrial Area, Okhla Phase-2', city: 'New Delhi', capacity: 10000, currentStock: 7800, manager: 'Arun Mehta', contact: '+91 98765 43210' },
    { id: '2', name: 'Noida Warehouse', code: 'W002', address: 'Sector 63, Noida', city: 'Noida', capacity: 8000, currentStock: 5200, manager: 'Priya Sharma', contact: '+91 98765 43211' },
    { id: '3', name: 'Gurgaon Depot', code: 'W003', address: 'IMT Manesar', city: 'Gurgaon', capacity: 12000, currentStock: 9840, manager: 'Rahul Gupta', contact: '+91 98765 43212' },
  ];
  
  const demoTeam: TeamMember[] = [
    { id: '1', name: 'Arun Mehta', email: 'arun.mehta@company.com', role: 'Warehouse Manager', department: 'Operations', status: 'active', joinDate: '2022-03-15' },
    { id: '2', name: 'Priya Sharma', email: 'priya.sharma@company.com', role: 'Logistics Coordinator', department: 'Logistics', status: 'active', joinDate: '2021-07-20' },
    { id: '3', name: 'Rahul Gupta', email: 'rahul.gupta@company.com', role: 'Inventory Analyst', department: 'Operations', status: 'active', joinDate: '2023-01-10' },
    { id: '4', name: 'Sneha Patel', email: 'sneha.patel@company.com', role: 'Supply Chain Manager', department: 'Management', status: 'active', joinDate: '2020-05-01' },
    { id: '5', name: 'Vikram Singh', email: 'vikram.singh@company.com', role: 'Fleet Manager', department: 'Logistics', status: 'on-leave', joinDate: '2022-09-12' },
    { id: '6', name: 'Anita Desai', email: 'anita.desai@company.com', role: 'Data Analyst', department: 'Analytics', status: 'active', joinDate: '2023-06-01' },
  ];
  
  const demoAlerts: Alert[] = [
    { id: '1', type: 'warning', title: 'Low Stock Alert', message: 'Refined Sunflower Oil is running low (320 units remaining)', timestamp: '2024-12-18T10:30:00', read: false, category: 'inventory' },
    { id: '2', type: 'error', title: 'Out of Stock', message: 'Sugar (White) is out of stock. Reorder immediately.', timestamp: '2024-12-18T09:15:00', read: false, category: 'inventory' },
    { id: '3', type: 'info', title: 'Delivery Completed', message: 'Order ORD-2024-001 delivered to Reliance Fresh', timestamp: '2024-12-17T16:45:00', read: true, category: 'delivery' },
    { id: '4', type: 'warning', title: 'Vehicle Maintenance', message: 'Vehicle UP05IJ7890 is due for scheduled maintenance', timestamp: '2024-12-18T08:00:00', read: false, category: 'system' },
    { id: '5', type: 'success', title: 'New Order Received', message: 'Order ORD-2024-005 received from More Supermarket', timestamp: '2024-12-18T11:00:00', read: true, category: 'order' },
  ];
  
  // ==================== EXPORT FUNCTIONS ====================
  
  export const getInventory = () => fetchData<InventoryItem[]>('inventory', demoInventory);
  export const getOrders = () => fetchData<Order[]>('orders', demoOrders);
  export const getVehicles = () => fetchData<Vehicle[]>('vehicles', demoVehicles);
  export const getWarehouses = () => fetchData<Warehouse[]>('warehouses', demoWarehouses);
  export const getTeam = () => fetchData<TeamMember[]>('team', demoTeam);
  export const getAlerts = () => fetchData<Alert[]>('alerts', demoAlerts);
  
  // Get all data at once
  export const getAllData = async () => {
    const [inventory, orders, vehicles, warehouses, team, alerts] = await Promise.all([
      getInventory(),
      getOrders(),
      getVehicles(),
      getWarehouses(),
      getTeam(),
      getAlerts(),
    ]);
    
    return { inventory, orders, vehicles, warehouses, team, alerts };
  };
  
  // Analytics data
  export const getAnalytics = async () => {
    const { inventory, orders, warehouses } = await getAllData();
    
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0);
    const avgWarehouseUtilization = warehouses.reduce((sum, w) => sum + (w.currentStock / w.capacity * 100), 0) / warehouses.length;
    
    return {
      totalInventoryValue,
      totalOrders,
      pendingOrders,
      totalRevenue,
      avgWarehouseUtilization,
      lowStockItems: inventory.filter(i => i.status === 'low-stock').length,
      outOfStockItems: inventory.filter(i => i.status === 'out-of-stock').length,
    };
  };
  