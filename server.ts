import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, 'data.json');

// Default initial data structure
const defaultData = {
  clients: [
    { id: 1, name: "Alice Johnson", company: "RetailCo", phone: "555-0101", email: "alice@retailco.demo", industry: "Retail", status: "active", created_at: "2026-04-01T10:00:00Z" },
    { id: 2, name: "Bob Smith", company: "GlobalTech", phone: "555-0202", email: "bob@globaltech.demo", industry: "Manufacturing", status: "active", created_at: "2026-04-05T10:00:00Z" },
    { id: 3, name: "Carol White", company: "MediPack Inc.", phone: "555-0303", email: "carol@medipack.demo", industry: "Medical", status: "active", created_at: "2026-04-10T10:00:00Z" }
  ],
  quotations: [
    { id: 1, client_id: 1, items: [{ description: "500ml Blue PET Bottles", quantity: 5000, unit_price: 0.20 }], total_amount: 1000, status: "accepted", created_at: "2026-04-10T10:00:00Z" },
    { id: 2, client_id: 3, items: [{ description: "250ml Clear Vials", quantity: 15000, unit_price: 0.15 }], total_amount: 2250, status: "sent", created_at: "2026-04-20T10:00:00Z" }
  ],
  orders: [
    { id: 1, client_id: 1, client_company: "RetailCo", product_details: "500ml Blue PET Bottles", quantity: 5000, deadline: "2026-04-30", status: "ready", quotation_id: 1 },
    { id: 2, client_id: 2, client_company: "GlobalTech", product_details: "Custom Moulded Parts", quantity: 2000, deadline: "2026-04-25", status: "in_production" },
    { id: 3, client_id: 2, client_company: "GlobalTech", product_details: "Precision Gears", quantity: 500, deadline: "2026-04-10", status: "in_production" }, // Delayed
    { id: 4, client_id: 3, client_company: "MediPack Inc.", product_details: "Sterile Caps", quantity: 10000, deadline: "2026-05-15", status: "planned" }
  ],
  inventory: [
    { id: 1, sku: "RAW-PET-01", name: "PET Resin Pellets (High Grade)", category: "raw", quantity: 1200, unit: "kg", cost: 1.20, reorder_point: 1500, last_updated: "2026-04-20T10:00:00Z" }, // Low stock
    { id: 2, sku: "RAW-COL-BLU", name: "Blue Colorant", category: "raw", quantity: 150, unit: "kg", cost: 5.50, reorder_point: 50, last_updated: "2026-04-20T10:00:00Z" },
    { id: 3, sku: "RAW-HDPE-02", name: "HDPE Granules", category: "raw", quantity: 8000, unit: "kg", cost: 0.90, reorder_point: 3000, last_updated: "2026-04-21T09:00:00Z" },
    { id: 4, sku: "FG-BOT-500", name: "500ml Blue Bottle", category: "finished", quantity: 12000, unit: "pcs", cost: 0.15, reorder_point: 5000, last_updated: "2026-04-22T08:00:00Z" },
    { id: 5, sku: "FG-VIAL-250", name: "250ml Clear Vial", category: "finished", quantity: 450, unit: "pcs", cost: 0.12, reorder_point: 2000, last_updated: "2026-04-23T08:00:00Z" } // Low stock
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

// Database helper functions
async function readDB() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await writeDB(defaultData);
      return defaultData;
    }
    throw error;
  }
}

async function writeDB(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Generate an auto-incrementing ID for a table given a list
function getNextId(tableArray) {
  return tableArray.length > 0 ? Math.max(...tableArray.map(item => item.id)) + 1 : 1;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Init DB file
  await readDB();

  // --- API Routes ---

  app.get('/api/dashboard', async (req, res) => {
    try {
      const db = await readDB();
      const totalOrders = (db.orders || []).length;
      const inProduction = (db.orders || []).filter(o => o.status === 'in_production').length;
      const delayedOrders = (db.orders || []).filter(o => o.status !== 'delivered' && o.deadline && new Date(o.deadline) < new Date()).length;
      const totalClients = (db.clients || []).length;
      
      const revenue = (db.quotations || [])
        .filter(q => q.status === 'accepted' || q.status === 'approved')
        .reduce((sum, q) => sum + (q.total_amount || q.price || 0), 0);

      // Simple mock activity trend
      const activityData = [
        { name: 'Mon', sales: 4000, production: 2400 },
        { name: 'Tue', sales: 3000, production: 1398 },
        { name: 'Wed', sales: 2000, production: 9800 },
        { name: 'Thu', sales: 2780, production: 3908 },
        { name: 'Fri', sales: 1890, production: 4800 },
        { name: 'Sat', sales: 2390, production: 3800 },
        { name: 'Sun', sales: 3490, production: 4300 },
      ];

      res.json({
        totalOrders,
        inProduction,
        delayedOrders,
        totalClients,
        basicRevenue: revenue,
        activityData
      });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/clients', async (req, res) => {
    try {
      const db = await readDB();
      // Sort descending by created_at
      const clients = [...db.clients].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json(clients);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/clients', async (req, res) => {
    try {
      const { name, company, phone, email, industry, notes } = req.body;
      const db = await readDB();
      
      const newClient = {
        id: getNextId(db.clients),
        name,
        company,
        phone: phone || null,
        email: email || null,
        industry: industry || null,
        notes: notes || null,
        created_at: new Date().toISOString()
      };
      
      db.clients.push(newClient);
      await writeDB(db);
      res.json(newClient);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/quotations', async (req, res) => {
    try {
      const db = await readDB();
      const quotesWithClient = db.quotations.map(q => {
        const client = db.clients.find(c => c.id === q.client_id) || {};
        return {
          ...q,
          client_company: client.company || 'Unknown',
          client_name: client.name || 'Unknown'
        };
      });
      // Sort descending
      quotesWithClient.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json(quotesWithClient);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/quotations', async (req, res) => {
    try {
      const { client_id, items, total_amount, status } = req.body;
      const db = await readDB();
      
      const newQuotation = {
        id: getNextId(db.quotations),
        client_id: parseInt(client_id, 10),
        items: items || [],
        total_amount: parseFloat(total_amount) || 0,
        status: status || 'pending',
        created_at: new Date().toISOString()
      };
      
      db.quotations.push(newQuotation);
      await writeDB(db);
      res.json(newQuotation);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/quotations/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const db = await readDB();
      const quoteIndex = db.quotations.findIndex(q => q.id === parseInt(req.params.id, 10));
      
      if (quoteIndex !== -1) {
        db.quotations[quoteIndex].status = status;
        await writeDB(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/orders/convert/:quotationId', async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId, 10);
      const { deadline } = req.body;
      const db = await readDB();
      
      const quoteIndex = db.quotations.findIndex(q => q.id === quotationId);
      if (quoteIndex === -1) return res.status(404).json({error: 'Quotation not found'});
      
      const quote = db.quotations[quoteIndex];
      const product_details = `${quote.product_type} - ${quote.size} (Printing: ${quote.printing_required ? 'Yes' : 'No'})`;
      
      const newOrder = {
        id: getNextId(db.orders),
        quotation_id: quote.id,
        client_id: quote.client_id,
        product_details: quote.items.map((i: any) => i.description).join(', ') || 'Converted Quote',
        quantity: quote.items.reduce((sum: number, i: any) => sum + (parseInt(i.quantity, 10)||0), 0) || 1,
        deadline: deadline || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      db.orders.push(newOrder);
      db.quotations[quoteIndex].status = 'approved';
      
      await writeDB(db);
      res.json(newOrder);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/orders', async (req, res) => {
    try {
      const db = await readDB();
      const ordersWithClient = db.orders.map(o => {
        const client = db.clients.find(c => c.id === o.client_id) || {};
        return {
          ...o,
          client_company: client.company || 'Unknown',
          client_name: client.name || 'Unknown'
        };
      });
      ordersWithClient.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      res.json(ordersWithClient);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const db = await readDB();
      const orderIndex = db.orders.findIndex(o => o.id === parseInt(req.params.id, 10));
      
      if (orderIndex !== -1) {
        db.orders[orderIndex].status = status;
        await writeDB(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/orders/manual', async (req, res) => {
    try {
      const { client_id, product_details, quantity, deadline } = req.body;
      const db = await readDB();
      const newOrder = {
        id: getNextId(db.orders),
        quotation_id: null,
        client_id: parseInt(client_id, 10),
        product_details,
        quantity: parseInt(quantity, 10),
        deadline: deadline || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      db.orders.push(newOrder);
      await writeDB(db);
      res.json(newOrder);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/inventory', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.inventory || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/inventory', async (req, res) => {
    try {
      const { sku, name, category, quantity, unit, reorder_point, cost } = req.body;
      const db = await readDB();
      if (!db.inventory) db.inventory = [];
      const newItem = {
        id: getNextId(db.inventory),
        sku,
        name,
        category, // 'raw' or 'finished'
        quantity: parseFloat(quantity),
        unit,
        reorder_point: parseFloat(reorder_point),
        cost: parseFloat(cost),
        last_updated: new Date().toISOString()
      };
      db.inventory.push(newItem);
      await writeDB(db);
      res.json(newItem);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/inventory/:id', async (req, res) => {
    try {
      const { quantity, action } = req.body; // action: 'add', 'deduct', 'set'
      const db = await readDB();
      const itemIndex = (db.inventory || []).findIndex(i => i.id === parseInt(req.params.id, 10));
      
      if (itemIndex !== -1) {
        const oldQty = db.inventory[itemIndex].quantity;
        let newQty = oldQty;
        const diff = parseFloat(quantity);
        if (action === 'add') newQty += diff;
        else if (action === 'deduct') newQty -= diff;
        else newQty = diff;

        db.inventory[itemIndex].quantity = newQty;
        db.inventory[itemIndex].last_updated = new Date().toISOString();

        if (!db.stock_movements) db.stock_movements = [];
        db.stock_movements.push({
          id: getNextId(db.stock_movements),
          item_sku: db.inventory[itemIndex].sku,
          movement_type: action === 'add' ? 'inward' : action === 'deduct' ? 'outward' : 'adjustment',
          quantity_change: Math.abs(newQty - oldQty),
          reference_id: null,
          notes: 'Manual Adjustment',
          created_at: new Date().toISOString(),
          user: 'Operator' 
        });

        await writeDB(db);
        res.json(db.inventory[itemIndex]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.delete('/api/inventory/:id', async (req, res) => {
    try {
      const db = await readDB();
      const itemIndex = (db.inventory || []).findIndex(i => i.id === parseInt(req.params.id, 10));
      if (itemIndex !== -1) {
        db.inventory.splice(itemIndex, 1);
        await writeDB(db);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Production API (BOM & Work Orders) ---

  app.get('/api/production/boms', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.boms || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/production/boms', async (req, res) => {
    try {
      const { finished_sku, name, components } = req.body;
      const db = await readDB();
      const newBom = {
        id: getNextId(db.boms || []),
        finished_sku,
        name,
        components, // Array of { sku, quantity_required }
        created_at: new Date().toISOString()
      };
      if (!db.boms) db.boms = [];
      db.boms.push(newBom);
      await writeDB(db);
      res.json(newBom);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/production/work-orders', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.work_orders || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/production/work-orders', async (req, res) => {
    try {
      const { bom_id, target_quantity } = req.body;
      const db = await readDB();
      const newWo = {
        id: getNextId(db.work_orders || []),
        bom_id: parseInt(bom_id, 10),
        target_quantity: parseFloat(target_quantity),
        status: 'planned',
        created_at: new Date().toISOString()
      };
      if (!db.work_orders) db.work_orders = [];
      db.work_orders.push(newWo);
      await writeDB(db);
      res.json(newWo);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Execute Work Order: Material consumption -> Finished goods added
  app.post('/api/production/work-orders/:id/complete', async (req, res) => {
    try {
      const { actual_yield } = req.body || {};
      const db = await readDB();
      const woIndex = (db.work_orders || []).findIndex(wo => wo.id === parseInt(req.params.id, 10));
      if (woIndex === -1) return res.status(404).json({ error: 'Work order not found' });
      
      const wo = db.work_orders[woIndex];
      if (wo.status === 'completed') return res.status(400).json({ error: 'Already completed' });

      const bom = (db.boms || []).find(b => b.id === wo.bom_id);
      if (!bom) return res.status(400).json({ error: 'BOM not found' });

      if (!db.stock_movements) db.stock_movements = [];

      const yieldQty = actual_yield !== undefined ? parseInt(actual_yield, 10) : wo.target_quantity;
      const discrepancy = wo.target_quantity - yieldQty;

      // 1. Deduct raw materials
      for (const comp of bom.components) {
        const consumedQty = comp.quantity_required * wo.target_quantity;
        const invIndex = db.inventory.findIndex(i => i.sku === comp.sku);
        if (invIndex !== -1) {
          db.inventory[invIndex].quantity -= consumedQty;
          db.inventory[invIndex].last_updated = new Date().toISOString();
          
          db.stock_movements.push({
            id: getNextId(db.stock_movements),
            item_sku: comp.sku,
            movement_type: 'consumed',
            quantity_change: consumedQty,
            reference_id: wo.id,
            notes: `Consumed for WO-${wo.id}`,
            created_at: new Date().toISOString(),
            user: 'System'
          });
        }
      }

      // 2. Add finished goods
      const fgIndex = db.inventory.findIndex(i => i.sku === bom.finished_sku);
      if (fgIndex !== -1) {
        db.inventory[fgIndex].quantity += yieldQty;
        db.inventory[fgIndex].last_updated = new Date().toISOString();
        
        db.stock_movements.push({
          id: getNextId(db.stock_movements),
          item_sku: bom.finished_sku,
          movement_type: 'manufactured',
          quantity_change: yieldQty,
          reference_id: wo.id,
          notes: discrepancy > 0 ? `Manufactured from WO-${wo.id} (Loss: ${discrepancy} units)` : `Manufactured from WO-${wo.id}`,
          created_at: new Date().toISOString(),
          user: 'System'
        });
      }

      // 3. Mark completed
      db.work_orders[woIndex].status = 'completed';
      db.work_orders[woIndex].completed_at = new Date().toISOString();
      db.work_orders[woIndex].actual_yield = yieldQty;
      db.work_orders[woIndex].wastage = discrepancy;

      // 4. Auto-generate Pending Quality Check
      if (!db.quality_checks) db.quality_checks = [];
      db.quality_checks.push({
        id: getNextId(db.quality_checks),
        work_order_id: wo.id,
        item_sku: bom.finished_sku,
        status: 'pending',
        defect_rate: 0,
        notes: '',
        inspected_at: null
      });
      
      await writeDB(db);
      res.json({ success: true, work_order: db.work_orders[woIndex] });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/production/work-orders/:id/status', async (req, res) => {
    try {
      const { status } = req.body;
      const db = await readDB();
      const woIndex = (db.work_orders || []).findIndex(wo => wo.id === parseInt(req.params.id, 10));
      if (woIndex === -1) return res.status(404).json({ error: 'Not found' });
      
      const wo = db.work_orders[woIndex];

      // Pre-flight check: "Checks raw material availability before scheduling"
      if (status === 'in_progress') {
        const bom = (db.boms || []).find(b => b.id === wo.bom_id);
        if (bom) {
          const shortages = [];
          for (const comp of bom.components) {
            const required = comp.quantity_required * wo.target_quantity;
            const invItem = (db.inventory || []).find(i => i.sku === comp.sku);
            if (!invItem || invItem.quantity < required) {
              shortages.push(`${comp.sku} (need ${required}, have ${invItem ? invItem.quantity : 0})`);
            }
          }
          if (shortages.length > 0) {
            return res.status(400).json({ error: `Cannot start production. Insufficient stock: ${shortages.join(', ')}` });
          }
        }
      }

      db.work_orders[woIndex].status = status;
      await writeDB(db);
      res.json(db.work_orders[woIndex]);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Quality Control API ---

  app.get('/api/quality', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.quality_checks || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.put('/api/quality/:id', async (req, res) => {
    try {
      const { status, defect_rate, notes } = req.body;
      const db = await readDB();
      const checkIndex = (db.quality_checks || []).findIndex(q => q.id === parseInt(req.params.id, 10));
      
      if (checkIndex !== -1) {
        db.quality_checks[checkIndex].status = status;
        db.quality_checks[checkIndex].defect_rate = parseFloat(defect_rate);
        db.quality_checks[checkIndex].notes = notes;
        db.quality_checks[checkIndex].inspected_at = new Date().toISOString();
        await writeDB(db);
        res.json(db.quality_checks[checkIndex]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Procurement API ---

  app.get('/api/procurement/suppliers', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.suppliers || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/procurement/suppliers', async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      const db = await readDB();
      const newSupplier = {
        id: getNextId(db.suppliers || []),
        name, email, phone,
        created_at: new Date().toISOString()
      };
      if (!db.suppliers) db.suppliers = [];
      db.suppliers.push(newSupplier);
      await writeDB(db);
      res.json(newSupplier);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/procurement/pos', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.purchase_orders || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.post('/api/procurement/pos', async (req, res) => {
    try {
      const { supplier_id, required_sku, quantity, expected_cost } = req.body;
      const db = await readDB();
      const newPO = {
        id: getNextId(db.purchase_orders || []),
        supplier_id: parseInt(supplier_id, 10),
        required_sku,
        quantity: parseFloat(quantity),
        expected_cost: parseFloat(expected_cost),
        status: 'draft',
        created_at: new Date().toISOString()
      };
      if (!db.purchase_orders) db.purchase_orders = [];
      db.purchase_orders.push(newPO);
      await writeDB(db);
      res.json(newPO);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Receive PO: Updates Inventory & Records Audit Log
  app.post('/api/procurement/pos/:id/receive', async (req, res) => {
    try {
      const db = await readDB();
      const poIndex = (db.purchase_orders || []).findIndex(po => po.id === parseInt(req.params.id, 10));
      if (poIndex === -1) return res.status(404).json({ error: 'PO not found' });
      
      const po = db.purchase_orders[poIndex];
      if (po.status === 'received') return res.status(400).json({ error: 'Already received' });

      // Add to inventory
      const invIndex = db.inventory.findIndex(i => i.sku === po.required_sku);
      if (invIndex !== -1) {
        db.inventory[invIndex].quantity += po.quantity;
        db.inventory[invIndex].last_updated = new Date().toISOString();
      } else {
        // Technically should exist or be created, but ignoring for sandbox safety
      }

      // Log Stock Movement
      if (!db.stock_movements) db.stock_movements = [];
      db.stock_movements.push({
        id: getNextId(db.stock_movements),
        item_sku: po.required_sku,
        movement_type: 'inward',
        quantity_change: po.quantity,
        reference_id: po.id, // PO ID
        notes: `Received from PO-${po.id}`,
        created_at: new Date().toISOString(),
        user: 'Manager' // Simulating Auth
      });

      db.purchase_orders[poIndex].status = 'received';
      db.purchase_orders[poIndex].received_at = new Date().toISOString();
      
      await writeDB(db);
      res.json({ success: true, purchase_order: db.purchase_orders[poIndex] });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get('/api/inventory/movements', async (req, res) => {
    try {
      const db = await readDB();
      res.json((db.stock_movements || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Warehouse API ---
  app.get('/api/warehouses', async (req, res) => {
    try {
      const db = await readDB();
      res.json(db.warehouses || []);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
