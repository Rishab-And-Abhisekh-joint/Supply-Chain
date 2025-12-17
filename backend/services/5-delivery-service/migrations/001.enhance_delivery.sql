-- Enhanced Delivery Service Migration
-- Run this migration to create all necessary tables and enums

-- ==================== DROP EXISTING IF NEEDED ====================
-- Uncomment if you need to reset the schema
-- DROP TABLE IF EXISTS route_stops CASCADE;
-- DROP TABLE IF EXISTS delivery_routes CASCADE;
-- DROP TABLE IF EXISTS drivers CASCADE;
-- DROP TABLE IF EXISTS vehicles CASCADE;
-- DROP TYPE IF EXISTS route_status CASCADE;
-- DROP TYPE IF EXISTS route_type CASCADE;
-- DROP TYPE IF EXISTS route_priority CASCADE;
-- DROP TYPE IF EXISTS vehicle_type CASCADE;
-- DROP TYPE IF EXISTS stop_status CASCADE;
-- DROP TYPE IF EXISTS stop_type CASCADE;
-- DROP TYPE IF EXISTS failure_reason CASCADE;
-- DROP TYPE IF EXISTS delivery_location CASCADE;
-- DROP TYPE IF EXISTS driver_status CASCADE;
-- DROP TYPE IF EXISTS driver_type CASCADE;
-- DROP TYPE IF EXISTS license_type CASCADE;
-- DROP TYPE IF EXISTS vehicle_status CASCADE;
-- DROP TYPE IF EXISTS vehicle_category CASCADE;
-- DROP TYPE IF EXISTS fuel_type CASCADE;

-- ==================== CREATE ENUMS ====================

-- Route enums
CREATE TYPE route_status AS ENUM ('DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'PARTIALLY_COMPLETED', 'CANCELLED');
CREATE TYPE route_type AS ENUM ('DELIVERY', 'PICKUP', 'MIXED', 'RETURN');
CREATE TYPE route_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE vehicle_type AS ENUM ('BIKE', 'MOTORCYCLE', 'CAR', 'VAN', 'TRUCK', 'REFRIGERATED');

-- Stop enums
CREATE TYPE stop_status AS ENUM ('PENDING', 'EN_ROUTE', 'ARRIVED', 'DELIVERING', 'DELIVERED', 'PARTIALLY_DELIVERED', 'FAILED', 'RESCHEDULED', 'CANCELLED', 'SKIPPED');
CREATE TYPE stop_type AS ENUM ('DELIVERY', 'PICKUP', 'RETURN', 'EXCHANGE', 'SERVICE');
CREATE TYPE failure_reason AS ENUM ('CUSTOMER_NOT_HOME', 'WRONG_ADDRESS', 'REFUSED_DELIVERY', 'DAMAGED_PACKAGE', 'ACCESS_DENIED', 'WEATHER_CONDITIONS', 'VEHICLE_ISSUE', 'CUSTOMER_REQUESTED_RESCHEDULE', 'BUSINESS_CLOSED', 'OTHER');
CREATE TYPE delivery_location AS ENUM ('FRONT_DOOR', 'BACK_DOOR', 'GARAGE', 'MAILROOM', 'RECEPTION', 'LOCKER', 'NEIGHBOR', 'SAFE_PLACE', 'HANDED_TO_CUSTOMER', 'OTHER');

-- Driver enums
CREATE TYPE driver_status AS ENUM ('AVAILABLE', 'ON_ROUTE', 'ON_BREAK', 'OFF_DUTY', 'UNAVAILABLE', 'INACTIVE');
CREATE TYPE driver_type AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACTOR', 'TEMPORARY');
CREATE TYPE license_type AS ENUM ('STANDARD', 'COMMERCIAL', 'HAZMAT', 'MOTORCYCLE');

-- Vehicle enums
CREATE TYPE vehicle_status AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE', 'RETIRED');
CREATE TYPE vehicle_category AS ENUM ('BIKE', 'MOTORCYCLE', 'CAR', 'VAN', 'SMALL_TRUCK', 'LARGE_TRUCK', 'REFRIGERATED_VAN', 'REFRIGERATED_TRUCK');
CREATE TYPE fuel_type AS ENUM ('GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG');

-- ==================== CREATE TABLES ====================

-- Drivers table
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    emergency_phone VARCHAR(20),
    emergency_contact VARCHAR(100),
    status driver_status DEFAULT 'OFF_DUTY',
    driver_type driver_type DEFAULT 'FULL_TIME',
    license_number VARCHAR(50),
    license_type license_type DEFAULT 'STANDARD',
    license_expiry DATE,
    license_state VARCHAR(100),
    assigned_vehicle_id UUID,
    assigned_vehicle_plate VARCHAR(20),
    can_handle_hazmat BOOLEAN DEFAULT FALSE,
    can_handle_refrigerated BOOLEAN DEFAULT FALSE,
    can_handle_oversized BOOLEAN DEFAULT FALSE,
    can_handle_cod BOOLEAN DEFAULT TRUE,
    certifications TEXT[],
    preferred_zones TEXT[],
    max_hours_per_day INTEGER DEFAULT 8,
    max_stops_per_day INTEGER,
    max_distance_per_day_km DECIMAL(10, 2),
    current_latitude DECIMAL(10, 7),
    current_longitude DECIMAL(10, 7),
    last_location_update TIMESTAMP,
    delivery_success_rate DECIMAL(5, 2) DEFAULT 100,
    average_rating DECIMAL(3, 2) DEFAULT 5,
    total_deliveries INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    total_ratings INTEGER DEFAULT 0,
    total_complaints INTEGER DEFAULT 0,
    default_shift_start TIME,
    default_shift_end TIME,
    work_days TEXT[],
    shift_start_time TIMESTAMP,
    shift_end_time TIMESTAMP,
    last_break_time TIMESTAMP,
    break_minutes_today INTEGER DEFAULT 0,
    home_address TEXT,
    home_latitude DECIMAL(10, 7),
    home_longitude DECIMAL(10, 7),
    device_id VARCHAR(100),
    app_version VARCHAR(50),
    last_app_activity TIMESTAMP,
    notes TEXT,
    hire_date DATE,
    termination_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(50),
    category vehicle_category DEFAULT 'VAN',
    status vehicle_status DEFAULT 'AVAILABLE',
    make VARCHAR(50),
    model VARCHAR(50),
    year INTEGER,
    color VARCHAR(50),
    fuel_type fuel_type DEFAULT 'GASOLINE',
    max_weight_kg DECIMAL(10, 2),
    max_volume_m3 DECIMAL(10, 2),
    max_packages INTEGER,
    cargo_length_m DECIMAL(5, 2),
    cargo_width_m DECIMAL(5, 2),
    cargo_height_m DECIMAL(5, 2),
    has_refrigeration BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5, 2),
    max_temperature DECIMAL(5, 2),
    has_lift_gate BOOLEAN DEFAULT FALSE,
    has_gps BOOLEAN DEFAULT FALSE,
    has_dash_cam BOOLEAN DEFAULT FALSE,
    can_transport_hazmat BOOLEAN DEFAULT FALSE,
    assigned_driver_id UUID REFERENCES drivers(id),
    assigned_driver_name VARCHAR(100),
    current_route_id UUID,
    current_latitude DECIMAL(10, 7),
    current_longitude DECIMAL(10, 7),
    last_location_update TIMESTAMP,
    current_odometer_km DECIMAL(10, 2) DEFAULT 0,
    fuel_capacity_liters DECIMAL(5, 2),
    current_fuel_level DECIMAL(5, 2),
    average_fuel_consumption DECIMAL(5, 2),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    last_maintenance_odometer_km DECIMAL(10, 2),
    maintenance_interval_km DECIMAL(10, 2),
    insurance_policy VARCHAR(100),
    insurance_expiry DATE,
    registration_expiry DATE,
    inspection_expiry DATE,
    purchase_price DECIMAL(10, 2),
    purchase_date DATE,
    monthly_lease_cost DECIMAL(10, 2),
    cost_per_km DECIMAL(6, 2),
    total_trips INTEGER DEFAULT 0,
    total_distance_km DECIMAL(12, 2) DEFAULT 0,
    total_deliveries INTEGER DEFAULT 0,
    home_warehouse_id UUID,
    home_warehouse_name VARCHAR(100),
    notes TEXT,
    features TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delivery routes table
CREATE TABLE delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number VARCHAR(50) UNIQUE NOT NULL,
    driver_id UUID REFERENCES drivers(id),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_plate VARCHAR(20),
    vehicle_type vehicle_type DEFAULT 'VAN',
    route_date DATE NOT NULL,
    status route_status DEFAULT 'DRAFT',
    route_type route_type DEFAULT 'DELIVERY',
    priority route_priority DEFAULT 'NORMAL',
    warehouse_id UUID,
    warehouse_name VARCHAR(100),
    zone VARCHAR(50),
    region VARCHAR(100),
    total_stops INTEGER DEFAULT 0,
    completed_stops INTEGER DEFAULT 0,
    failed_stops INTEGER DEFAULT 0,
    skipped_stops INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5, 2) DEFAULT 0,
    estimated_distance_km DECIMAL(10, 2),
    actual_distance_km DECIMAL(10, 2),
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    planned_start_time TIMESTAMP,
    planned_end_time TIMESTAMP,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    assigned_at TIMESTAMP,
    max_weight_kg DECIMAL(10, 2),
    current_weight_kg DECIMAL(10, 2),
    max_volume_m3 DECIMAL(10, 2),
    current_volume_m3 DECIMAL(10, 2),
    max_packages INTEGER,
    current_packages INTEGER DEFAULT 0,
    current_latitude DECIMAL(10, 7),
    current_longitude DECIMAL(10, 7),
    last_location_update TIMESTAMP,
    is_optimized BOOLEAN DEFAULT FALSE,
    optimized_at TIMESTAMP,
    optimization_algorithm VARCHAR(50),
    has_fragile_items BOOLEAN DEFAULT FALSE,
    has_hazardous_items BOOLEAN DEFAULT FALSE,
    requires_signature BOOLEAN DEFAULT FALSE,
    requires_id_verification BOOLEAN DEFAULT FALSE,
    has_temperature_control BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5, 2),
    max_temperature DECIMAL(5, 2),
    notes TEXT,
    driver_instructions TEXT,
    dispatch_notes TEXT,
    created_by UUID,
    assigned_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Route stops table
CREATE TABLE route_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES delivery_routes(id) ON DELETE CASCADE,
    order_id UUID NOT NULL,
    order_number VARCHAR(50),
    stop_type stop_type DEFAULT 'DELIVERY',
    status stop_status DEFAULT 'PENDING',
    planned_sequence INTEGER NOT NULL,
    actual_sequence INTEGER,
    customer_id UUID,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    delivery_address TEXT NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    time_window_start TIMESTAMP,
    time_window_end TIMESTAMP,
    estimated_arrival_time TIMESTAMP,
    actual_arrival_time TIMESTAMP,
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    departure_time TIMESTAMP,
    estimated_service_minutes INTEGER,
    actual_service_minutes INTEGER,
    wait_time_minutes INTEGER,
    package_count INTEGER DEFAULT 1,
    total_weight_kg DECIMAL(10, 2),
    total_volume_m3 DECIMAL(10, 2),
    package_type VARCHAR(50),
    requires_signature BOOLEAN DEFAULT FALSE,
    requires_id_verification BOOLEAN DEFAULT FALSE,
    requires_adult_signature BOOLEAN DEFAULT FALSE,
    is_fragile BOOLEAN DEFAULT FALSE,
    is_hazardous BOOLEAN DEFAULT FALSE,
    requires_temperature_control BOOLEAN DEFAULT FALSE,
    is_cash_on_delivery BOOLEAN DEFAULT FALSE,
    cod_amount DECIMAL(10, 2),
    cod_currency VARCHAR(10) DEFAULT 'USD',
    cod_collected BOOLEAN DEFAULT FALSE,
    delivery_location delivery_location,
    recipient_name VARCHAR(100),
    signature_url TEXT,
    photo_urls TEXT[],
    relation_to_customer VARCHAR(100),
    failure_reason failure_reason,
    failure_notes TEXT,
    attempt_number INTEGER DEFAULT 1,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_date TIMESTAMP,
    delivery_instructions TEXT,
    access_code TEXT,
    customer_notes TEXT,
    driver_notes TEXT,
    priority INTEGER DEFAULT 0,
    is_urgent BOOLEAN DEFAULT FALSE,
    distance_from_previous_km DECIMAL(10, 2),
    driving_time_from_previous_minutes INTEGER,
    customer_rating INTEGER,
    customer_feedback TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,
    notification_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CREATE INDEXES ====================

-- Drivers indexes
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_active ON drivers(is_active);
CREATE INDEX idx_drivers_type ON drivers(driver_type);

-- Vehicles indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_category ON vehicles(category);
CREATE INDEX idx_vehicles_active ON vehicles(is_active);

-- Routes indexes
CREATE INDEX idx_routes_status ON delivery_routes(status);
CREATE INDEX idx_routes_date ON delivery_routes(route_date);
CREATE INDEX idx_routes_driver ON delivery_routes(driver_id);
CREATE INDEX idx_routes_status_date ON delivery_routes(status, route_date);
CREATE INDEX idx_routes_driver_date ON delivery_routes(driver_id, route_date);
CREATE INDEX idx_routes_zone ON delivery_routes(zone);
CREATE INDEX idx_routes_warehouse ON delivery_routes(warehouse_id);

-- Stops indexes
CREATE INDEX idx_stops_route ON route_stops(route_id);
CREATE INDEX idx_stops_status ON route_stops(status);
CREATE INDEX idx_stops_order ON route_stops(order_id);
CREATE INDEX idx_stops_sequence ON route_stops(route_id, planned_sequence);
CREATE INDEX idx_stops_customer ON route_stops(customer_id);
CREATE INDEX idx_stops_urgent ON route_stops(is_urgent) WHERE is_urgent = TRUE;
CREATE INDEX idx_stops_cod ON route_stops(is_cash_on_delivery) WHERE is_cash_on_delivery = TRUE;

-- ==================== CREATE UPDATE TRIGGERS ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON delivery_routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stops_updated_at
    BEFORE UPDATE ON route_stops
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== INSERT SAMPLE DATA ====================

-- Sample drivers
INSERT INTO drivers (employee_id, first_name, last_name, email, phone, status, driver_type, license_type, can_handle_cod, preferred_zones)
VALUES 
    ('DRV-001', 'John', 'Smith', 'john.smith@delivery.com', '+1-555-0101', 'AVAILABLE', 'FULL_TIME', 'COMMERCIAL', TRUE, ARRAY['ZONE-A', 'ZONE-B']),
    ('DRV-002', 'Maria', 'Garcia', 'maria.garcia@delivery.com', '+1-555-0102', 'AVAILABLE', 'FULL_TIME', 'STANDARD', TRUE, ARRAY['ZONE-C']),
    ('DRV-003', 'James', 'Wilson', 'james.wilson@delivery.com', '+1-555-0103', 'OFF_DUTY', 'PART_TIME', 'STANDARD', TRUE, ARRAY['ZONE-A']),
    ('DRV-004', 'Emily', 'Brown', 'emily.brown@delivery.com', '+1-555-0104', 'AVAILABLE', 'FULL_TIME', 'HAZMAT', TRUE, ARRAY['ZONE-B', 'ZONE-D']),
    ('DRV-005', 'Michael', 'Davis', 'michael.davis@delivery.com', '+1-555-0105', 'ON_BREAK', 'CONTRACTOR', 'COMMERCIAL', TRUE, ARRAY['ZONE-E']);

-- Sample vehicles
INSERT INTO vehicles (vehicle_number, license_plate, category, status, make, model, year, fuel_type, max_weight_kg, max_volume_m3, max_packages, has_gps)
VALUES 
    ('VH-001', 'ABC-1234', 'VAN', 'AVAILABLE', 'Ford', 'Transit', 2023, 'GASOLINE', 1500, 12.5, 100, TRUE),
    ('VH-002', 'DEF-5678', 'VAN', 'AVAILABLE', 'Mercedes', 'Sprinter', 2022, 'DIESEL', 2000, 15.0, 120, TRUE),
    ('VH-003', 'GHI-9012', 'SMALL_TRUCK', 'AVAILABLE', 'Isuzu', 'NPR', 2023, 'DIESEL', 4500, 25.0, 200, TRUE),
    ('VH-004', 'JKL-3456', 'REFRIGERATED_VAN', 'MAINTENANCE', 'Ford', 'Transit Reefer', 2022, 'DIESEL', 1200, 10.0, 80, TRUE),
    ('VH-005', 'MNO-7890', 'CAR', 'AVAILABLE', 'Toyota', 'Prius', 2024, 'HYBRID', 200, 1.0, 20, TRUE);

-- ==================== ADD COMMENTS ====================

COMMENT ON TABLE drivers IS 'Stores delivery driver information and status';
COMMENT ON TABLE vehicles IS 'Stores vehicle fleet information';
COMMENT ON TABLE delivery_routes IS 'Stores delivery route plans and their execution status';
COMMENT ON TABLE route_stops IS 'Stores individual stops within delivery routes';

COMMENT ON COLUMN delivery_routes.route_number IS 'Auto-generated unique route identifier (RT-YYYY-XXXXXX)';
COMMENT ON COLUMN delivery_routes.completion_percentage IS 'Calculated percentage of completed stops';
COMMENT ON COLUMN route_stops.planned_sequence IS 'Order of stop in the planned route';
COMMENT ON COLUMN route_stops.actual_sequence IS 'Actual order stop was visited';
COMMENT ON COLUMN route_stops.attempt_number IS 'Current delivery attempt number';