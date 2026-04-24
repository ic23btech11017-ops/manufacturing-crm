import fs from 'fs';

const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

const defaultData = {
  inventory: [
    { id: 1, sku: "RAW-PET-01", name: "PET Resin Pellets (High Grade)", category: "raw", quantity: 1200, unit: "kg", cost: 1.20, reorder_point: 1500, last_updated: "2026-04-20T10:00:00Z" },
    { id: 2, sku: "RAW-COL-BLU", name: "Blue Colorant", category: "raw", quantity: 150, unit: "kg", cost: 5.50, reorder_point: 50, last_updated: "2026-04-20T10:00:00Z" },
    { id: 3, sku: "RAW-HDPE-02", name: "HDPE Granules", category: "raw", quantity: 8000, unit: "kg", cost: 0.90, reorder_point: 3000, last_updated: "2026-04-21T09:00:00Z" },
    { id: 4, sku: "FG-BOT-500", name: "500ml Blue Bottle", category: "finished", quantity: 12000, unit: "pcs", cost: 0.15, reorder_point: 5000, last_updated: "2026-04-22T08:00:00Z" },
    { id: 5, sku: "FG-VIAL-250", name: "250ml Clear Vial", category: "finished", quantity: 450, unit: "pcs", cost: 0.12, reorder_point: 2000, last_updated: "2026-04-23T08:00:00Z" }
  ],
  boms: [
    { id: 1, finished_sku: "FG-BOT-500", name: "Blue Bottle Standard Mix", components: [ { sku: "RAW-PET-01", quantity_required: 0.05 }, { sku: "RAW-COL-BLU", quantity_required: 0.002 } ], created_at: "2026-04-10T10:00:00Z" },
    { id: 2, finished_sku: "FG-VIAL-250", name: "Clear Vial Medical Mix", components: [ { sku: "RAW-PET-01", quantity_required: 0.03 } ], created_at: "2026-04-12T10:00:00Z" }
  ],
  work_orders: [
    { id: 1, bom_id: 1, target_quantity: 10000, status: 'completed', created_at: "2026-04-12T10:00:00Z", completed_at: "2026-04-13T10:00:00Z" },
    { id: 2, bom_id: 1, target_quantity: 5000, status: 'in_progress', created_at: "2026-04-22T09:00:00Z", machine_id: "Extruder-A" },
    { id: 3, bom_id: 2, target_quantity: 8000, status: 'planned', created_at: "2026-04-23T10:00:00Z" }
  ],
  suppliers: [
    { id: 1, name: "PolyChem Bulk Supplies", email: "sales@polychem.demo", phone: "1-800-POLY", created_at: "2026-04-01T00:00:00Z" },
    { id: 2, name: "Vibrant Colorants Ltd", email: "orders@vibrant.demo", phone: "1-800-COLOR", created_at: "2026-04-05T00:00:00Z" },
    { id: 3, name: "BioMed Plastics", email: "supply@biomed.demo", phone: "1-800-BIOM", created_at: "2026-04-10T00:00:00Z" }
  ],
  purchase_orders: [
    { id: 1, supplier_id: 1, required_sku: "RAW-PET-01", quantity: 5000, expected_cost: 6000, status: 'received', created_at: "2026-04-10T00:00:00Z", received_at: "2026-04-15T10:00:00Z" },
    { id: 2, supplier_id: 2, required_sku: "RAW-COL-BLU", quantity: 100, expected_cost: 550, status: 'approved', created_at: "2026-04-22T10:00:00Z" },
    { id: 3, supplier_id: 1, required_sku: "RAW-PET-01", quantity: 10000, expected_cost: 11500, status: 'draft', created_at: "2026-04-24T08:00:00Z" }
  ],
  stock_movements: [
    { id: 1, item_sku: "RAW-PET-01", movement_type: 'inward', quantity_change: 5000, reference_id: 1, notes: "Received from PO-1 (Automated GRN)", created_at: "2026-04-15T10:00:00Z", user: "System" },
    { id: 2, item_sku: "RAW-PET-01", movement_type: 'consumed', quantity_change: 512.5, reference_id: 1, notes: "Consumed for WO-1. Includes 2.5% theoretical material loss.", created_at: "2026-04-16T10:00:00Z", user: "System" },
    { id: 3, item_sku: "RAW-COL-BLU", movement_type: 'consumed', quantity_change: 20.1, reference_id: 1, notes: "Consumed for WO-1. Includes 0.5% wastage.", created_at: "2026-04-16T10:00:00Z", user: "System" },
    { id: 4, item_sku: "FG-BOT-500", movement_type: 'manufactured', quantity_change: 10000, reference_id: 1, notes: "Manufactured from WO-1", created_at: "2026-04-16T10:00:00Z", user: "System" },
    { id: 5, item_sku: "RAW-PET-01", movement_type: 'adjustment', quantity_change: -15, reference_id: null, notes: "Spillage during unloading documented by Shift Lead.", created_at: "2026-04-17T09:00:00Z", user: "Shift Lead" },
    { id: 6, item_sku: "FG-BOT-500", movement_type: 'outward', quantity_change: -5000, reference_id: 1, notes: "Dispatched Order #1 to RetailCo", created_at: "2026-04-18T14:30:00Z", user: "Logistics Manager" }
  ],
  quality_checks: [
    { id: 1, work_order_id: 1, item_sku: "FG-BOT-500", status: 'passed', defect_rate: 0.5, notes: "Minor flashes on 50 units (material scrap traced to PET).", inspected_at: "2026-04-16T11:00:00Z" },
    { id: 2, work_order_id: 2, item_sku: "FG-BOT-500", status: 'pending', defect_rate: 0, notes: "", inspected_at: null }
  ],
  warehouses: [
    { id: 1, name: 'Main Plant Warehouse', location: 'Zone A', manager: 'Alice' },
    { id: 2, name: 'Cold Storage (Colorants)', location: 'Zone B', manager: 'Bob' }
  ]
};

let needsUpdate = false;
for (const key in defaultData) {
  if (!data[key]) {
    data[key] = defaultData[key];
    needsUpdate = true;
  }
}

if (needsUpdate) {
  fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  console.log('Fixed data.json by adding missing arrays.');
} else {
  console.log('data.json already has all arrays.');
}
