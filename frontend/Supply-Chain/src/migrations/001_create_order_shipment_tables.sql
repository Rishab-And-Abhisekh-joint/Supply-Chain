-- Migration: Create Order, Shipment, and Route tables for Supply Chain
-- Run this against your Render PostgreSQL database

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    tracking_number VARCHAR(20) UNIQUE NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    customer_id VARCHAR(50),
    customer_name VARCHAR(255),
    items JSONB NOT NULL DEFAULT '[]',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    delivery_type VARCHAR(100),
    assigned_vehicle VARCHAR(50),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders(user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- SHIPMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(20) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    vehicle_id VARCHAR(50),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    vehicle_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'picking_up',
    origin_name VARCHAR(255),
    origin_lat DECIMAL(10, 6),
    origin_lng DECIMAL(10, 6),
    destination_name VARCHAR(255),
    destination_lat DECIMAL(10, 6),
    destination_lng DECIMAL(10, 6),
    current_lat DECIMAL(10, 6),
    current_lng DECIMAL(10, 6),
    route_data JSONB,
    eta VARCHAR(100),
    progress INTEGER DEFAULT 0,
    distance VARCHAR(50),
    savings VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shipments_user_email ON shipments(user_email);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_vehicle ON shipments(vehicle_id);

-- ============================================
-- OPTIMIZED ROUTES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS optimized_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    route_name VARCHAR(255),
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    from_lat DECIMAL(10, 6),
    from_lng DECIMAL(10, 6),
    to_lat DECIMAL(10, 6),
    to_lng DECIMAL(10, 6),
    distance VARCHAR(50),
    time VARCHAR(50),
    savings VARCHAR(50),
    fuel_cost DECIMAL(10, 2),
    route_coordinates JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_routes_user_email ON optimized_routes(user_email);
CREATE INDEX IF NOT EXISTS idx_routes_active ON optimized_routes(is_active);

-- ============================================
-- AVAILABLE TRUCKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trucks (
    id VARCHAR(50) PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    driver_name VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    capacity_kg INTEGER,
    status VARCHAR(50) DEFAULT 'available',
    current_lat DECIMAL(10, 6),
    current_lng DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default trucks
INSERT INTO trucks (id, vehicle_number, driver_name, vehicle_type, capacity_kg, status) VALUES
    ('TRK-001', 'MH-01-AB-1234', 'Rajesh Kumar', 'Heavy Truck', 15000, 'available'),
    ('TRK-002', 'DL-02-CD-5678', 'Amit Singh', 'Medium Truck', 8000, 'available'),
    ('TRK-003', 'KA-03-EF-9012', 'Suresh Patel', 'Heavy Truck', 15000, 'available'),
    ('TRK-004', 'TN-04-GH-3456', 'Vikram Rao', 'Delivery Van', 3000, 'available'),
    ('TRK-005', 'WB-05-IJ-7890', 'Manoj Verma', 'Heavy Truck', 15000, 'available')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRIGGER FOR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to shipments
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at
    BEFORE UPDATE ON shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View for orders with shipment info
CREATE OR REPLACE VIEW orders_with_shipments AS
SELECT 
    o.*,
    s.id as shipment_id,
    s.status as shipment_status,
    s.progress as shipment_progress,
    s.current_lat,
    s.current_lng,
    s.eta
FROM orders o
LEFT JOIN shipments s ON o.id = s.order_id;

-- View for active shipments with full details
CREATE OR REPLACE VIEW active_shipments AS
SELECT 
    s.*,
    o.total_amount,
    o.items,
    o.shipping_address
FROM shipments s
JOIN orders o ON s.order_id = o.id
WHERE s.status != 'delivered';

COMMENT ON TABLE orders IS 'Stores all orders placed through the supply chain system';
COMMENT ON TABLE shipments IS 'Tracks shipment status and location for orders';
COMMENT ON TABLE optimized_routes IS 'Stores optimized route configurations';
COMMENT ON TABLE trucks IS 'Available trucks/vehicles for deliveries';
