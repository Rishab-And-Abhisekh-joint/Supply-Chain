-- Migration: Enhance Orders Table for Supply Chain Platform
-- Run this migration to update your existing orders table or create new ones

-- Drop existing tables if needed (BE CAREFUL IN PRODUCTION!)
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;

-- Create enum types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 
        'SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 
        'DELIVERED', 'CANCELLED', 'REFUNDED', 'ON_HOLD'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'PENDING', 'AUTHORIZED', 'PAID', 'PARTIALLY_PAID', 'REFUNDED', 'FAILED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_type AS ENUM (
        'STANDARD', 'EXPRESS', 'OVERNIGHT', 'SAME_DAY', 'PICKUP'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_item_status AS ENUM (
        'PENDING', 'RESERVED', 'PICKED', 'PACKED', 
        'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'BACKORDERED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create or update orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderNumber" VARCHAR(50) UNIQUE NOT NULL,
    "customerId" UUID NOT NULL,
    "customerName" VARCHAR(255),
    "customerEmail" VARCHAR(255),
    "customerPhone" VARCHAR(50),
    "orderDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status order_status DEFAULT 'PENDING',
    "paymentStatus" payment_status DEFAULT 'PENDING',
    subtotal DECIMAL(10, 2) DEFAULT 0,
    "taxAmount" DECIMAL(10, 2) DEFAULT 0,
    "shippingCost" DECIMAL(10, 2) DEFAULT 0,
    "discountAmount" DECIMAL(10, 2) DEFAULT 0,
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    "amountPaid" DECIMAL(10, 2) DEFAULT 0,
    "shippingAddress" TEXT NOT NULL,
    "shippingCity" VARCHAR(100),
    "shippingState" VARCHAR(100),
    "shippingCountry" VARCHAR(100),
    "shippingZipCode" VARCHAR(20),
    "billingAddress" TEXT,
    "deliveryType" delivery_type DEFAULT 'STANDARD',
    "expectedDeliveryDate" TIMESTAMP,
    "actualDeliveryDate" TIMESTAMP,
    "transitId" UUID,
    "trackingNumber" VARCHAR(100),
    "warehouseId" UUID,
    notes TEXT,
    "internalNotes" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP,
    "paymentMethod" VARCHAR(50),
    "paymentReference" VARCHAR(255),
    "isPriority" BOOLEAN DEFAULT FALSE,
    "isGift" BOOLEAN DEFAULT FALSE,
    "giftMessage" TEXT
);

-- Create or update order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    "productId" UUID NOT NULL,
    "productSku" VARCHAR(100),
    "productName" VARCHAR(255) NOT NULL,
    "productDescription" TEXT,
    quantity INTEGER NOT NULL,
    "quantityFulfilled" INTEGER DEFAULT 0,
    "unitPrice" DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    "taxAmount" DECIMAL(10, 2) DEFAULT 0,
    "totalPrice" DECIMAL(10, 2) NOT NULL,
    status order_item_status DEFAULT 'PENDING',
    "imageUrl" TEXT,
    weight DECIMAL(10, 3),
    "weightUnit" VARCHAR(10),
    "warehouseId" UUID,
    "binLocation" VARCHAR(50),
    "lotNumber" VARCHAR(100),
    "serialNumber" VARCHAR(100),
    notes TEXT,
    "stockReserved" BOOLEAN DEFAULT FALSE,
    "reservationId" VARCHAR(255),
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders("customerId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders("orderDate");
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items("orderId");
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items("productId");
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- Update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE orders IS 'Main orders table for supply chain platform';
COMMENT ON TABLE order_items IS 'Line items for each order';
COMMENT ON COLUMN orders."orderNumber" IS 'Human-readable order number (e.g., ORD-2024-000001)';
COMMENT ON COLUMN orders."transitId" IS 'Reference to delivery service record';
COMMENT ON COLUMN order_items."stockReserved" IS 'Whether inventory has been reserved for this item';