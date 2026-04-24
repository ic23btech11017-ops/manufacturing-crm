-- Manufacturing Operations System (MOS)
-- PostgreSQL Initial Schema Script

-- 1. ENUMS
CREATE TYPE item_category AS ENUM ('raw_material', 'finished_good', 'consumable');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'operator');
CREATE TYPE order_status AS ENUM ('pending', 'in_production', 'ready', 'dispatched', 'delivered');
CREATE TYPE wo_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE movement_type AS ENUM ('inward', 'outward', 'transfer', 'consumed', 'manufactured');

-- 2. USERS
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'operator',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ITEMS (Catalog)
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category item_category NOT NULL,
    unit VARCHAR(50) NOT NULL,
    cost DECIMAL(12, 2) DEFAULT 0.00,
    reorder_point DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INVENTORY BALANCES
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id) -- In multi-warehouse, this would be UNIQUE(item_id, warehouse_id)
);

-- 5. STOCK MOVEMENTS (Audit Trail)
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES items(id),
    user_id INT REFERENCES users(id),
    movement_type movement_type NOT NULL,
    quantity_change DECIMAL(12, 2) NOT NULL,
    reference_id INT, -- E.g., Work Order ID, PO ID, or Sales Order ID
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. PROCUREMENT (Suppliers & POs)
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    supplier_id INT REFERENCES suppliers(id),
    item_id INT REFERENCES items(id),
    quantity DECIMAL(12, 2) NOT NULL,
    expected_cost DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP
);

-- 7. BILL OF MATERIALS (BOM)
CREATE TABLE boms (
    id SERIAL PRIMARY KEY,
    finished_item_id INT REFERENCES items(id) ON DELETE CASCADE,
    version VARCHAR(20) DEFAULT 'v1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bom_components (
    id SERIAL PRIMARY KEY,
    bom_id INT REFERENCES boms(id) ON DELETE CASCADE,
    raw_item_id INT REFERENCES items(id),
    quantity_required DECIMAL(12, 2) NOT NULL
);

-- 8. WORK ORDERS (Production)
CREATE TABLE work_orders (
    id SERIAL PRIMARY KEY,
    bom_id INT REFERENCES boms(id),
    target_quantity DECIMAL(12, 2) NOT NULL,
    status wo_status DEFAULT 'planned',
    priority INT DEFAULT 1,
    assigned_to INT REFERENCES users(id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. QUALITY CONTROL
CREATE TABLE quality_inspections (
    id SERIAL PRIMARY KEY,
    work_order_id INT REFERENCES work_orders(id),
    inspector_id INT REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending',
    defect_rate DECIMAL(5, 2) DEFAULT 0.00,
    notes TEXT,
    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. WAREHOUSE LOCATIONS
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location_code VARCHAR(50) UNIQUE NOT NULL
);
