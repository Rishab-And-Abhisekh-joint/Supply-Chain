-- Warehouse Service Database Migration
-- Version: 2.0
-- Description: Enhanced warehouse schema with picklists, receiving, and location management

-- ==================== ENUM TYPES ====================

-- PickList Status Enum
DO $$ BEGIN
    CREATE TYPE picklist_status AS ENUM (
        'PENDING',
        'ASSIGNED', 
        'IN_PROGRESS',
        'PARTIALLY_PICKED',
        'COMPLETED',
        'ON_HOLD',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PickList Priority Enum
DO $$ BEGIN
    CREATE TYPE picklist_priority AS ENUM (
        'LOW',
        'NORMAL',
        'HIGH',
        'URGENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PickList Type Enum
DO $$ BEGIN
    CREATE TYPE picklist_type AS ENUM (
        'STANDARD',
        'EXPRESS',
        'BATCH',
        'WAVE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- PickList Item Status Enum
DO $$ BEGIN
    CREATE TYPE picklist_item_status AS ENUM (
        'PENDING',
        'LOCATED',
        'PICKED',
        'VERIFIED',
        'SHORT',
        'DAMAGED',
        'SKIPPED',
        'SUBSTITUTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Receiving Status Enum
DO $$ BEGIN
    CREATE TYPE receiving_status AS ENUM (
        'SCHEDULED',
        'IN_PROGRESS',
        'PENDING_QC',
        'COMPLETED',
        'PARTIALLY_RECEIVED',
        'ON_HOLD',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Receiving Type Enum
DO $$ BEGIN
    CREATE TYPE receiving_type AS ENUM (
        'PURCHASE_ORDER',
        'TRANSFER',
        'RETURN',
        'ADJUSTMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Receiving Item Status Enum
DO $$ BEGIN
    CREATE TYPE receiving_item_status AS ENUM (
        'PENDING',
        'RECEIVED',
        'PARTIALLY_RECEIVED',
        'REJECTED',
        'DAMAGED',
        'QUARANTINED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Receiving Item Condition Enum
DO $$ BEGIN
    CREATE TYPE receiving_item_condition AS ENUM (
        'GOOD',
        'DAMAGED',
        'EXPIRED',
        'WRONG_ITEM',
        'MISSING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Location Type Enum
DO $$ BEGIN
    CREATE TYPE location_type AS ENUM (
        'STORAGE',
        'PICKING',
        'RECEIVING',
        'SHIPPING',
        'STAGING',
        'RETURNS',
        'QUARANTINE'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Location Status Enum
DO $$ BEGIN
    CREATE TYPE location_status AS ENUM (
        'ACTIVE',
        'INACTIVE',
        'FULL',
        'MAINTENANCE',
        'RESERVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==================== TABLES ====================

-- PickLists Table
CREATE TABLE IF NOT EXISTS picklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pick_list_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL,
    order_number VARCHAR(50),
    status picklist_status DEFAULT 'PENDING',
    priority picklist_priority DEFAULT 'NORMAL',
    type picklist_type DEFAULT 'STANDARD',
    assigned_to VARCHAR(255),
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    warehouse_id VARCHAR(50),
    zone VARCHAR(50),
    total_items INTEGER DEFAULT 0,
    picked_items INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_weight DECIMAL(10,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    customer_name VARCHAR(255),
    shipping_method VARCHAR(100),
    expected_ship_date DATE,
    is_rush BOOLEAN DEFAULT FALSE,
    requires_verification BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    notes TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PickList Items Table
CREATE TABLE IF NOT EXISTS picklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pick_list_id UUID NOT NULL REFERENCES picklists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_sku VARCHAR(100),
    product_name VARCHAR(255),
    product_description TEXT,
    quantity_required INTEGER NOT NULL,
    quantity_picked INTEGER DEFAULT 0,
    quantity_short INTEGER DEFAULT 0,
    status picklist_item_status DEFAULT 'PENDING',
    location VARCHAR(100),
    aisle VARCHAR(20),
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    zone VARCHAR(50),
    pick_sequence INTEGER,
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    expiration_date DATE,
    barcode VARCHAR(100),
    unit_weight DECIMAL(10,3),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    unit_price DECIMAL(12,2),
    image_url VARCHAR(500),
    picked_by VARCHAR(255),
    picked_at TIMESTAMP,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    substitute_product_id UUID,
    substitute_reason TEXT,
    requires_serial_scan BOOLEAN DEFAULT FALSE,
    requires_lot_tracking BOOLEAN DEFAULT FALSE,
    is_hazardous BOOLEAN DEFAULT FALSE,
    is_fragile BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receiving Records Table
CREATE TABLE IF NOT EXISTS receiving_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_number VARCHAR(50) UNIQUE NOT NULL,
    status receiving_status DEFAULT 'SCHEDULED',
    type receiving_type DEFAULT 'PURCHASE_ORDER',
    purchase_order_id UUID,
    purchase_order_number VARCHAR(50),
    supplier_id UUID,
    supplier_name VARCHAR(255),
    warehouse_id VARCHAR(50),
    receiving_dock VARCHAR(50),
    expected_date DATE,
    received_date TIMESTAMP,
    received_by VARCHAR(255),
    total_items_expected INTEGER DEFAULT 0,
    total_items_received INTEGER DEFAULT 0,
    total_quantity_expected INTEGER DEFAULT 0,
    total_quantity_received INTEGER DEFAULT 0,
    carrier_name VARCHAR(100),
    tracking_number VARCHAR(100),
    bill_of_lading VARCHAR(100),
    pallet_count INTEGER,
    carton_count INTEGER,
    total_weight DECIMAL(10,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    requires_quality_check BOOLEAN DEFAULT FALSE,
    quality_check_by VARCHAR(255),
    quality_check_date TIMESTAMP,
    quality_check_notes TEXT,
    has_discrepancy BOOLEAN DEFAULT FALSE,
    discrepancy_notes TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receiving Items Table
CREATE TABLE IF NOT EXISTS receiving_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_record_id UUID NOT NULL REFERENCES receiving_records(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_sku VARCHAR(100),
    product_name VARCHAR(255),
    quantity_expected INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    quantity_rejected INTEGER DEFAULT 0,
    quantity_damaged INTEGER DEFAULT 0,
    status receiving_item_status DEFAULT 'PENDING',
    condition receiving_item_condition DEFAULT 'GOOD',
    location_code VARCHAR(100),
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    batch_number VARCHAR(100),
    manufacturing_date DATE,
    expiration_date DATE,
    barcode VARCHAR(100),
    unit_cost DECIMAL(12,2),
    total_cost DECIMAL(12,2),
    unit_weight DECIMAL(10,3),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    received_by VARCHAR(255),
    received_at TIMESTAMP,
    inspected_by VARCHAR(255),
    inspected_at TIMESTAMP,
    requires_inspection BOOLEAN DEFAULT FALSE,
    is_quarantined BOOLEAN DEFAULT FALSE,
    inspection_notes TEXT,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouse Locations Table
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id VARCHAR(50),
    zone VARCHAR(50),
    aisle VARCHAR(20),
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    type location_type DEFAULT 'STORAGE',
    status location_status DEFAULT 'ACTIVE',
    max_weight DECIMAL(10,2),
    weight_unit VARCHAR(10) DEFAULT 'kg',
    max_volume DECIMAL(10,2),
    volume_unit VARCHAR(10) DEFAULT 'm3',
    length DECIMAL(10,2),
    width DECIMAL(10,2),
    height DECIMAL(10,2),
    dimension_unit VARCHAR(10) DEFAULT 'cm',
    current_weight DECIMAL(10,2) DEFAULT 0,
    current_volume DECIMAL(10,2) DEFAULT 0,
    current_item_count INTEGER DEFAULT 0,
    is_temperature_controlled BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5,2),
    max_temperature DECIMAL(5,2),
    temperature_unit VARCHAR(5) DEFAULT 'C',
    is_hazardous BOOLEAN DEFAULT FALSE,
    is_high_value BOOLEAN DEFAULT FALSE,
    pick_priority INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== INDEXES ====================

-- PickList indexes
CREATE INDEX IF NOT EXISTS idx_picklists_status ON picklists(status);
CREATE INDEX IF NOT EXISTS idx_picklists_order_id ON picklists(order_id);
CREATE INDEX IF NOT EXISTS idx_picklists_assigned_to ON picklists(assigned_to);
CREATE INDEX IF NOT EXISTS idx_picklists_created_at ON picklists(created_at);
CREATE INDEX IF NOT EXISTS idx_picklists_is_rush ON picklists(is_rush);
CREATE INDEX IF NOT EXISTS idx_picklists_warehouse_zone ON picklists(warehouse_id, zone);

-- PickList Items indexes
CREATE INDEX IF NOT EXISTS idx_picklist_items_pick_list_id ON picklist_items(pick_list_id);
CREATE INDEX IF NOT EXISTS idx_picklist_items_product_id ON picklist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_picklist_items_status ON picklist_items(status);
CREATE INDEX IF NOT EXISTS idx_picklist_items_location ON picklist_items(location);

-- Receiving indexes
CREATE INDEX IF NOT EXISTS idx_receiving_status ON receiving_records(status);
CREATE INDEX IF NOT EXISTS idx_receiving_supplier_id ON receiving_records(supplier_id);
CREATE INDEX IF NOT EXISTS idx_receiving_created_at ON receiving_records(created_at);
CREATE INDEX IF NOT EXISTS idx_receiving_expected_date ON receiving_records(expected_date);
CREATE INDEX IF NOT EXISTS idx_receiving_has_discrepancy ON receiving_records(has_discrepancy);

-- Receiving Items indexes
CREATE INDEX IF NOT EXISTS idx_receiving_items_record_id ON receiving_items(receiving_record_id);
CREATE INDEX IF NOT EXISTS idx_receiving_items_product_id ON receiving_items(product_id);
CREATE INDEX IF NOT EXISTS idx_receiving_items_status ON receiving_items(status);

-- Location indexes
CREATE INDEX IF NOT EXISTS idx_locations_warehouse_zone ON warehouse_locations(warehouse_id, zone);
CREATE INDEX IF NOT EXISTS idx_locations_type ON warehouse_locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_status ON warehouse_locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_aisle ON warehouse_locations(aisle);
CREATE INDEX IF NOT EXISTS idx_locations_pick_priority ON warehouse_locations(pick_priority);

-- ==================== UPDATE TRIGGERS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_picklists_updated_at ON picklists;
CREATE TRIGGER update_picklists_updated_at
    BEFORE UPDATE ON picklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_picklist_items_updated_at ON picklist_items;
CREATE TRIGGER update_picklist_items_updated_at
    BEFORE UPDATE ON picklist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receiving_records_updated_at ON receiving_records;
CREATE TRIGGER update_receiving_records_updated_at
    BEFORE UPDATE ON receiving_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_receiving_items_updated_at ON receiving_items;
CREATE TRIGGER update_receiving_items_updated_at
    BEFORE UPDATE ON receiving_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_warehouse_locations_updated_at ON warehouse_locations;
CREATE TRIGGER update_warehouse_locations_updated_at
    BEFORE UPDATE ON warehouse_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== SAMPLE DATA ====================

-- Sample warehouse locations
INSERT INTO warehouse_locations (location_code, warehouse_id, zone, aisle, rack, shelf, bin, type, status, max_weight, pick_priority)
VALUES 
    ('A-01-A-01', 'WH001', 'PICKING', 'A', '01', 'A', '01', 'PICKING', 'ACTIVE', 100.00, 1),
    ('A-01-A-02', 'WH001', 'PICKING', 'A', '01', 'A', '02', 'PICKING', 'ACTIVE', 100.00, 2),
    ('B-05-C-03', 'WH001', 'STORAGE', 'B', '05', 'C', '03', 'STORAGE', 'ACTIVE', 500.00, 50),
    ('B-05-C-04', 'WH001', 'STORAGE', 'B', '05', 'C', '04', 'STORAGE', 'ACTIVE', 500.00, 51),
    ('R-01-A-01', 'WH001', 'RECEIVING', 'R', '01', 'A', '01', 'RECEIVING', 'ACTIVE', 1000.00, 100),
    ('S-01-A-01', 'WH001', 'SHIPPING', 'S', '01', 'A', '01', 'SHIPPING', 'ACTIVE', 1000.00, 100),
    ('Q-01-A-01', 'WH001', 'QUARANTINE', 'Q', '01', 'A', '01', 'QUARANTINE', 'ACTIVE', 200.00, 200)
ON CONFLICT (location_code) DO NOTHING;

-- ==================== COMMENTS ====================

COMMENT ON TABLE picklists IS 'Picklists for order fulfillment';
COMMENT ON TABLE picklist_items IS 'Individual items within a picklist';
COMMENT ON TABLE receiving_records IS 'Records of incoming inventory shipments';
COMMENT ON TABLE receiving_items IS 'Individual items within a receiving record';
COMMENT ON TABLE warehouse_locations IS 'Physical storage locations within warehouses';
