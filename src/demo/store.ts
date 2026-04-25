import seedData from '../../data.json';

const STORAGE_KEY = 'kalnet-demo-store-v1';
const STORAGE_VERSION = 1;
const STORE_EVENT = 'kalnet-demo-store-updated';

type NumericInput = number | string | null | undefined;

export type Client = {
  id: number;
  name: string;
  company: string;
  phone: string | null;
  email: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
};

export type QuoteItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type QuotationRecord = {
  id: number;
  client_id: number;
  items: QuoteItem[];
  total_amount: number;
  status: string;
  created_at: string;
  product_type?: string;
  size?: string;
  quantity?: number;
  price?: number;
};

export type Quotation = QuotationRecord & {
  client_company: string;
  client_name: string;
};

export type OrderRecord = {
  id: number;
  quotation_id: number | null;
  client_id: number;
  product_details: string;
  quantity: number;
  deadline: string | null;
  status: string;
  created_at: string | null;
};

export type Order = OrderRecord & {
  client_company: string;
  client_name: string;
};

export type InventoryItem = {
  id: number;
  sku: string;
  name: string;
  category: 'raw' | 'finished';
  quantity: number;
  unit: string;
  reorder_point: number;
  cost: number;
  last_updated: string;
};

export type BOMComponent = {
  sku: string;
  quantity_required: number;
};

export type BOM = {
  id: number;
  finished_sku: string;
  name: string;
  components: BOMComponent[];
  created_at: string;
};

export type WorkOrder = {
  id: number;
  bom_id: number;
  target_quantity: number;
  status: 'planned' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  actual_yield?: number;
  wastage?: number;
  machine_id?: string;
};

export type Supplier = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type PurchaseOrder = {
  id: number;
  supplier_id: number;
  required_sku: string;
  quantity: number;
  expected_cost: number;
  status: 'draft' | 'approved' | 'received';
  created_at: string;
  received_at?: string;
};

export type StockMovement = {
  id: number;
  item_sku: string;
  movement_type: string;
  quantity_change: number;
  reference_id: number | null;
  notes: string;
  created_at: string;
  user: string;
};

export type QualityCheck = {
  id: number;
  work_order_id: number;
  item_sku: string;
  status: 'pending' | 'passed' | 'failed';
  defect_rate: number;
  notes: string;
  inspected_at: string | null;
};

export type Warehouse = {
  id: number;
  name: string;
  location: string;
  manager: string;
};

export type StockTransfer = {
  id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  item_sku: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  requested_at: string;
};

export type ActivityLogEntry = {
  id: number;
  actor: string;
  role: string;
  action: string;
  entity: string;
  timestamp: string;
};

type DemoStore = {
  clients: Client[];
  quotations: QuotationRecord[];
  orders: OrderRecord[];
  inventory: InventoryItem[];
  boms: BOM[];
  workOrders: WorkOrder[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  stockMovements: StockMovement[];
  qualityChecks: QualityCheck[];
  warehouses: Warehouse[];
  stockTransfers: StockTransfer[];
  activityLog: ActivityLogEntry[];
};

type PersistedDemoStore = DemoStore & {
  version: number;
};

// Current actor injected by AuthContext after login/logout
let _currentActor = { name: 'System', role: 'system' };
export function setStoreActor(actor: string, role: string) {
  _currentActor = { name: actor, role };
}

function appendActivity(store: PersistedDemoStore, action: string, entity: string) {
  const entry: ActivityLogEntry = {
    id: store.activityLog.length > 0 ? Math.max(...store.activityLog.map(e => e.id)) + 1 : 1,
    actor: _currentActor.name,
    role: _currentActor.role,
    action,
    entity,
    timestamp: new Date().toISOString(),
  };
  store.activityLog.push(entry);
  if (store.activityLog.length > 200) {
    store.activityLog.splice(0, store.activityLog.length - 200);
  }
}

type DashboardMetrics = {
  totalOrders: number;
  inProduction: number;
  delayedOrders: number;
  totalClients: number;
  basicRevenue: number;
  activityData: Array<{ name: string; sales: number; production: number }>;
};

type ReportingSnapshot = {
  orderTrends: Array<{ name: string; orders: number }>;
  inventoryValuation: number;
  inventoryByCategory: Array<{ name: string; value: number }>;
  qualityPassRate: number;
  totalOrders: number;
};

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function normalizeNumber(value: NumericInput, fallback = 0) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function normalizeText(value: string | null | undefined, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeDate(value: string | null | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toISOString();
}

function sortByTimestampDesc<T>(items: T[], selector: (item: T) => string | null | undefined) {
  return [...items].sort((a, b) => getTimestamp(selector(b)) - getTimestamp(selector(a)));
}

function getTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function getNextId(items: Array<{ id: number }>) {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
}

function getWeekdayLabel(value: string | null | undefined) {
  if (!value) {
    return 'Mon';
  }

  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(value));
}

function getMonthLabel(value: string | null | undefined) {
  if (!value) {
    return 'Jan';
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(new Date(value));
}

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitStoreUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_EVENT));
  }
}

function hydrateQuotation(record: QuotationRecord, clients: Client[]): Quotation {
  const client = clients.find((entry) => entry.id === record.client_id);

  return {
    ...record,
    client_company: client?.company ?? 'Unknown',
    client_name: client?.name ?? 'Unknown'
  };
}

function hydrateOrder(record: OrderRecord, clients: Client[]): Order {
  const client = clients.find((entry) => entry.id === record.client_id);
  const fallbackCreatedAt = record.deadline ? normalizeDate(record.deadline, new Date().toISOString()) : new Date().toISOString();

  return {
    ...record,
    created_at: record.created_at ?? fallbackCreatedAt,
    client_company: client?.company ?? 'Unknown',
    client_name: client?.name ?? 'Unknown'
  };
}

function createFallbackQuotationItems(rawQuote: any): QuoteItem[] {
  const description = [rawQuote.product_type, rawQuote.size].filter(Boolean).join(' - ') || 'Custom Product';
  const quantity = normalizeNumber(rawQuote.quantity, 1);
  const total = normalizeNumber(rawQuote.total_amount ?? rawQuote.price, 0);

  return [
    {
      description,
      quantity,
      unit_price: quantity > 0 ? Number((total / quantity).toFixed(2)) : total
    }
  ];
}

function normalizeQuotationItems(rawQuote: any) {
  if (!Array.isArray(rawQuote.items) || rawQuote.items.length === 0) {
    return createFallbackQuotationItems(rawQuote);
  }

  return rawQuote.items.map((item: any) => ({
    description: normalizeText(item.description, 'Custom Line Item'),
    quantity: normalizeNumber(item.quantity, 1),
    unit_price: normalizeNumber(item.unit_price, 0)
  }));
}

function createInitialTransfers(warehouses: Warehouse[]): StockTransfer[] {
  if (warehouses.length < 2) {
    return [];
  }

  const [origin, destination] = warehouses;

  return [
    {
      id: 1,
      from_warehouse_id: origin.id,
      to_warehouse_id: destination.id,
      item_sku: 'RAW-COL-BLU',
      quantity: 80,
      status: 'completed',
      requested_at: '2026-04-23T07:30:00.000Z'
    },
    {
      id: 2,
      from_warehouse_id: destination.id,
      to_warehouse_id: origin.id,
      item_sku: 'FG-BOT-500',
      quantity: 2400,
      status: 'pending',
      requested_at: '2026-04-24T10:15:00.000Z'
    },
    {
      id: 3,
      from_warehouse_id: origin.id,
      to_warehouse_id: destination.id,
      item_sku: 'RAW-PET-01',
      quantity: 600,
      status: 'completed',
      requested_at: '2026-04-21T05:00:00.000Z'
    }
  ];
}

function createInitialStore(): PersistedDemoStore {
  const raw = seedData as any;
  const now = new Date().toISOString();

  const clients: Client[] = (raw.clients ?? []).map((client: any) => ({
    id: normalizeNumber(client.id),
    name: normalizeText(client.name, 'Unknown Contact'),
    company: normalizeText(client.company, 'Unknown Company'),
    phone: client.phone ?? null,
    email: client.email ?? null,
    industry: client.industry ?? null,
    notes: client.notes ?? null,
    created_at: normalizeDate(client.created_at, now)
  }));

  const quotations: QuotationRecord[] = (raw.quotations ?? []).map((quote: any) => {
    const items = normalizeQuotationItems(quote);
    const totalAmount = normalizeNumber(
      quote.total_amount,
      items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    );

    return {
      id: normalizeNumber(quote.id),
      client_id: normalizeNumber(quote.client_id),
      items,
      total_amount: totalAmount,
      status: normalizeText(quote.status, 'pending'),
      created_at: normalizeDate(quote.created_at, now),
      product_type: quote.product_type,
      size: quote.size,
      quantity: quote.quantity,
      price: quote.price
    };
  });

  const orders: OrderRecord[] = (raw.orders ?? []).map((order: any) => ({
    id: normalizeNumber(order.id),
    quotation_id: order.quotation_id === null ? null : normalizeNumber(order.quotation_id, 0),
    client_id: normalizeNumber(order.client_id),
    product_details: normalizeText(order.product_details, 'Converted Quote'),
    quantity: normalizeNumber(order.quantity, 1),
    deadline: order.deadline ? normalizeDate(order.deadline, now) : null,
    status: normalizeText(order.status, 'pending'),
    created_at: order.created_at ? normalizeDate(order.created_at, now) : null
  }));

  const inventory: InventoryItem[] = (raw.inventory ?? []).map((item: any) => ({
    id: normalizeNumber(item.id),
    sku: normalizeText(item.sku, `SKU-${item.id}`),
    name: normalizeText(item.name, 'Inventory Item'),
    category: item.category === 'finished' ? 'finished' : 'raw',
    quantity: normalizeNumber(item.quantity, 0),
    unit: normalizeText(item.unit, 'pcs'),
    reorder_point: normalizeNumber(item.reorder_point, 0),
    cost: normalizeNumber(item.cost, 0),
    last_updated: normalizeDate(item.last_updated, now)
  }));

  const boms: BOM[] = (raw.boms ?? []).map((bom: any) => ({
    id: normalizeNumber(bom.id),
    finished_sku: normalizeText(bom.finished_sku, ''),
    name: normalizeText(bom.name, 'Unnamed BOM'),
    components: Array.isArray(bom.components)
      ? bom.components.map((component: any) => ({
          sku: normalizeText(component.sku, ''),
          quantity_required: normalizeNumber(component.quantity_required, 0)
        }))
      : [],
    created_at: normalizeDate(bom.created_at, now)
  }));

  const workOrders: WorkOrder[] = (raw.work_orders ?? []).map((workOrder: any) => ({
    id: normalizeNumber(workOrder.id),
    bom_id: normalizeNumber(workOrder.bom_id),
    target_quantity: normalizeNumber(workOrder.target_quantity, 0),
    status: workOrder.status === 'completed' || workOrder.status === 'in_progress' ? workOrder.status : 'planned',
    created_at: normalizeDate(workOrder.created_at, now),
    completed_at: workOrder.completed_at ? normalizeDate(workOrder.completed_at, now) : undefined,
    actual_yield: workOrder.actual_yield ?? (workOrder.status === 'completed' ? normalizeNumber(workOrder.target_quantity, 0) : undefined),
    wastage: workOrder.wastage ?? 0,
    machine_id: workOrder.machine_id
  }));

  const suppliers: Supplier[] = (raw.suppliers ?? []).map((supplier: any) => ({
    id: normalizeNumber(supplier.id),
    name: normalizeText(supplier.name, 'Supplier'),
    email: supplier.email ?? null,
    phone: supplier.phone ?? null,
    created_at: normalizeDate(supplier.created_at, now)
  }));

  const purchaseOrders: PurchaseOrder[] = (raw.purchase_orders ?? []).map((purchaseOrder: any) => ({
    id: normalizeNumber(purchaseOrder.id),
    supplier_id: normalizeNumber(purchaseOrder.supplier_id),
    required_sku: normalizeText(purchaseOrder.required_sku, ''),
    quantity: normalizeNumber(purchaseOrder.quantity, 0),
    expected_cost: normalizeNumber(purchaseOrder.expected_cost, 0),
    status: purchaseOrder.status === 'received' || purchaseOrder.status === 'approved' ? purchaseOrder.status : 'draft',
    created_at: normalizeDate(purchaseOrder.created_at, now),
    received_at: purchaseOrder.received_at ? normalizeDate(purchaseOrder.received_at, now) : undefined
  }));

  const stockMovements: StockMovement[] = (raw.stock_movements ?? []).map((movement: any) => ({
    id: normalizeNumber(movement.id),
    item_sku: normalizeText(movement.item_sku, ''),
    movement_type: normalizeText(movement.movement_type, 'adjustment'),
    quantity_change: Math.abs(normalizeNumber(movement.quantity_change, 0)),
    reference_id: movement.reference_id === null ? null : normalizeNumber(movement.reference_id, 0),
    notes: normalizeText(movement.notes, ''),
    created_at: normalizeDate(movement.created_at, now),
    user: normalizeText(movement.user, 'System')
  }));

  const qualityChecks: QualityCheck[] = (raw.quality_checks ?? []).map((check: any) => ({
    id: normalizeNumber(check.id),
    work_order_id: normalizeNumber(check.work_order_id),
    item_sku: normalizeText(check.item_sku, ''),
    status: check.status === 'failed' || check.status === 'passed' ? check.status : 'pending',
    defect_rate: normalizeNumber(check.defect_rate, 0),
    notes: normalizeText(check.notes, ''),
    inspected_at: check.inspected_at ? normalizeDate(check.inspected_at, now) : null
  }));

  const warehouses: Warehouse[] = (raw.warehouses ?? []).map((warehouse: any) => ({
    id: normalizeNumber(warehouse.id),
    name: normalizeText(warehouse.name, 'Warehouse'),
    location: normalizeText(warehouse.location, ''),
    manager: normalizeText(warehouse.manager, 'Unassigned')
  }));

  return {
    version: STORAGE_VERSION,
    clients,
    quotations,
    orders,
    inventory,
    boms,
    workOrders,
    suppliers,
    purchaseOrders,
    stockMovements,
    qualityChecks,
    warehouses,
    stockTransfers: createInitialTransfers(warehouses),
    activityLog: []
  };
}

function readStore(): PersistedDemoStore {
  if (!hasStorage()) {
    return createInitialStore();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = createInitialStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(stored) as PersistedDemoStore;
    if (parsed?.version === STORAGE_VERSION) {
      if (!parsed.activityLog) parsed.activityLog = [];
      return parsed;
    }
  } catch {
    // Fallback to reseeding below.
  }

  const reset = createInitialStore();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
  return reset;
}

function writeStore(store: PersistedDemoStore) {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  emitStoreUpdate();
}

function selectStore<T>(selector: (store: PersistedDemoStore) => T) {
  return cloneValue(selector(readStore()));
}

function updateStore<T>(updater: (store: PersistedDemoStore) => T) {
  const store = readStore();
  const result = updater(store);
  writeStore(store);
  return cloneValue(result);
}

function ensureFinishedGood(store: PersistedDemoStore, sku: string, name: string) {
  let item = store.inventory.find((entry) => entry.sku === sku);

  if (!item) {
    item = {
      id: getNextId(store.inventory),
      sku,
      name,
      category: 'finished',
      quantity: 0,
      unit: 'pcs',
      reorder_point: 1000,
      cost: 0,
      last_updated: new Date().toISOString()
    };
    store.inventory.push(item);
  }

  return item;
}

function ensureRawMaterial(store: PersistedDemoStore, purchaseOrder: PurchaseOrder) {
  let item = store.inventory.find((entry) => entry.sku === purchaseOrder.required_sku);

  if (!item) {
    item = {
      id: getNextId(store.inventory),
      sku: purchaseOrder.required_sku,
      name: `Material ${purchaseOrder.required_sku}`,
      category: 'raw',
      quantity: 0,
      unit: 'kg',
      reorder_point: Math.max(100, Math.round(purchaseOrder.quantity * 0.25)),
      cost: purchaseOrder.quantity > 0 ? purchaseOrder.expected_cost / purchaseOrder.quantity : 0,
      last_updated: new Date().toISOString()
    };
    store.inventory.push(item);
  }

  return item;
}

function createActivityData(store: PersistedDemoStore) {
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'];
  const salesTotal = store.quotations.reduce((sum, q) => sum + q.total_amount, 0);
  const productionTotal = store.workOrders.reduce(
    (sum, wo) => sum + (wo.actual_yield ?? wo.target_quantity),
    0
  );

  const salesBaseline = Math.max(18000, salesTotal * 0.6);
  const productionBaseline = Math.max(12000, productionTotal * 8);

  // Realistic week-over-week patterns: growth with mid-run dip and recovery
  const salesWeights    = [0.72, 0.88, 1.05, 0.93, 1.18, 1.02, 1.28, 1.15];
  const productionWeights = [0.65, 0.82, 1.10, 0.78, 1.22, 0.95, 1.35, 1.20];

  return labels.map((name, i) => ({
    name,
    sales: Math.round(salesBaseline * salesWeights[i]),
    production: Math.round(productionBaseline * productionWeights[i])
  }));
}

export function subscribeToDemoStore(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = () => {
    listener();
  };

  window.addEventListener(STORE_EVENT, handler);

  return () => {
    window.removeEventListener(STORE_EVENT, handler);
  };
}

export async function getClients() {
  return sortByTimestampDesc(selectStore((store) => store.clients), (client) => client.created_at);
}

export async function getActivityLog() {
  return selectStore((store) => [...store.activityLog].reverse());
}

export async function createClient(input: Omit<Client, 'id' | 'created_at'>) {
  return updateStore((store) => {
    const client: Client = {
      id: getNextId(store.clients),
      name: normalizeText(input.name, 'New Contact'),
      company: normalizeText(input.company, 'New Company'),
      phone: input.phone || null,
      email: input.email || null,
      industry: input.industry || null,
      notes: input.notes || null,
      created_at: new Date().toISOString()
    };

    store.clients.push(client);
    appendActivity(store, 'Created client', client.company);
    return client;
  });
}

export async function getQuotations() {
  return selectStore((store) =>
    sortByTimestampDesc(
      store.quotations.map((quotation) => hydrateQuotation(quotation, store.clients)),
      (quotation) => quotation.created_at
    )
  );
}

export async function createQuotation(input: {
  client_id: number | string;
  items: Array<{ description: string; quantity: NumericInput; unit_price: NumericInput }>;
  total_amount: NumericInput;
  status?: string;
}) {
  return updateStore((store) => {
    const quotation: QuotationRecord = {
      id: getNextId(store.quotations),
      client_id: normalizeNumber(input.client_id),
      items: input.items.map((item) => ({
        description: normalizeText(item.description, 'Custom Line Item'),
        quantity: normalizeNumber(item.quantity, 1),
        unit_price: normalizeNumber(item.unit_price, 0)
      })),
      total_amount: normalizeNumber(input.total_amount, 0),
      status: normalizeText(input.status, 'pending'),
      created_at: new Date().toISOString()
    };

    store.quotations.push(quotation);
    appendActivity(store, 'Created quotation', `QT-${quotation.id}`);
    return hydrateQuotation(quotation, store.clients);
  });
}

export async function updateQuotationStatus(id: number, status: string) {
  return updateStore((store) => {
    const quotation = store.quotations.find((entry) => entry.id === id);
    if (!quotation) {
      throw new Error('Quotation not found.');
    }

    quotation.status = status;
    appendActivity(store, `Quotation status → ${status}`, `QT-${id}`);
    return hydrateQuotation(quotation, store.clients);
  });
}

export async function convertQuotationToOrder(quotationId: number, deadline: string | null) {
  return updateStore((store) => {
    const quotation = store.quotations.find((entry) => entry.id === quotationId);
    if (!quotation) {
      throw new Error('Quotation not found.');
    }

    const order: OrderRecord = {
      id: getNextId(store.orders),
      quotation_id: quotation.id,
      client_id: quotation.client_id,
      product_details: quotation.items.length > 0
        ? quotation.items.map((item) => item.description).join(', ')
        : quotation.product_type || 'Converted Quote',
      quantity: quotation.items.reduce((sum, item) => sum + normalizeNumber(item.quantity, 0), 0) || normalizeNumber(quotation.quantity, 1),
      deadline: deadline ? normalizeDate(deadline, new Date().toISOString()) : null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    quotation.status = 'approved';
    store.orders.push(order);
    appendActivity(store, 'Converted quotation to order', `ORD-${order.id}`);
    return hydrateOrder(order, store.clients);
  });
}

export async function getOrders() {
  return selectStore((store) =>
    sortByTimestampDesc(
      store.orders.map((order) => hydrateOrder(order, store.clients)),
      (order) => order.created_at
    )
  );
}

export async function createManualOrder(input: {
  client_id: number | string;
  product_details: string;
  quantity: NumericInput;
  deadline: string | null;
}) {
  return updateStore((store) => {
    const order: OrderRecord = {
      id: getNextId(store.orders),
      quotation_id: null,
      client_id: normalizeNumber(input.client_id),
      product_details: normalizeText(input.product_details, 'Manual Order'),
      quantity: normalizeNumber(input.quantity, 1),
      deadline: input.deadline ? normalizeDate(input.deadline, new Date().toISOString()) : null,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    store.orders.push(order);
    appendActivity(store, 'Created manual order', `ORD-${order.id}`);
    return hydrateOrder(order, store.clients);
  });
}

export async function updateOrderStatus(id: number, status: string) {
  return updateStore((store) => {
    const order = store.orders.find((entry) => entry.id === id);
    if (!order) {
      throw new Error('Order not found.');
    }

    order.status = status;
    appendActivity(store, `Order status → ${status}`, `ORD-${id}`);
    return hydrateOrder(order, store.clients);
  });
}

export async function getInventory() {
  return sortByTimestampDesc(selectStore((store) => store.inventory), (item) => item.last_updated);
}

export async function getStockMovements() {
  return sortByTimestampDesc(selectStore((store) => store.stockMovements), (movement) => movement.created_at);
}

export async function createInventoryItem(input: Omit<InventoryItem, 'id' | 'last_updated' | 'quantity' | 'reorder_point' | 'cost'> & {
  quantity: NumericInput;
  reorder_point: NumericInput;
  cost: NumericInput;
}) {
  return updateStore((store) => {
    const item: InventoryItem = {
      id: getNextId(store.inventory),
      sku: normalizeText(input.sku, `SKU-${store.inventory.length + 1}`),
      name: normalizeText(input.name, 'Inventory Item'),
      category: input.category === 'finished' ? 'finished' : 'raw',
      quantity: normalizeNumber(input.quantity, 0),
      unit: normalizeText(input.unit, 'pcs'),
      reorder_point: normalizeNumber(input.reorder_point, 0),
      cost: normalizeNumber(input.cost, 0),
      last_updated: new Date().toISOString()
    };

    store.inventory.push(item);
    return item;
  });
}

export async function adjustInventoryItem(id: number, quantity: NumericInput, action: 'add' | 'deduct' | 'set') {
  return updateStore((store) => {
    const item = store.inventory.find((entry) => entry.id === id);
    if (!item) {
      throw new Error('Inventory item not found.');
    }

    const change = normalizeNumber(quantity, 0);
    const previousQuantity = item.quantity;

    if (action === 'add') {
      item.quantity += change;
    } else if (action === 'deduct') {
      item.quantity -= change;
    } else {
      item.quantity = change;
    }

    item.last_updated = new Date().toISOString();

    store.stockMovements.push({
      id: getNextId(store.stockMovements),
      item_sku: item.sku,
      movement_type: action === 'add' ? 'inward' : action === 'deduct' ? 'outward' : 'adjustment',
      quantity_change: Math.abs(item.quantity - previousQuantity),
      reference_id: null,
      notes: 'Manual Adjustment',
      created_at: new Date().toISOString(),
      user: _currentActor.name
    });

    appendActivity(store, `Stock adjusted (${action})`, item.sku);
    return item;
  });
}

export async function deleteInventoryItem(id: number) {
  return updateStore((store) => {
    const index = store.inventory.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new Error('Inventory item not found.');
    }

    const [removed] = store.inventory.splice(index, 1);
    return removed;
  });
}

export async function getBoms() {
  return sortByTimestampDesc(selectStore((store) => store.boms), (bom) => bom.created_at);
}

export async function createBom(input: {
  finished_sku: string;
  name: string;
  components: Array<{ sku: string; quantity_required: NumericInput }>;
}) {
  return updateStore((store) => {
    const bom: BOM = {
      id: getNextId(store.boms),
      finished_sku: normalizeText(input.finished_sku, ''),
      name: normalizeText(input.name, 'New BOM'),
      components: input.components.map((component) => ({
        sku: normalizeText(component.sku, ''),
        quantity_required: normalizeNumber(component.quantity_required, 0)
      })),
      created_at: new Date().toISOString()
    };

    store.boms.push(bom);
    return bom;
  });
}

export async function getWorkOrders() {
  return sortByTimestampDesc(selectStore((store) => store.workOrders), (workOrder) => workOrder.created_at);
}

export async function createWorkOrder(input: { bom_id: NumericInput; target_quantity: NumericInput }) {
  return updateStore((store) => {
    const workOrder: WorkOrder = {
      id: getNextId(store.workOrders),
      bom_id: normalizeNumber(input.bom_id),
      target_quantity: normalizeNumber(input.target_quantity, 0),
      status: 'planned',
      created_at: new Date().toISOString()
    };

    store.workOrders.push(workOrder);
    appendActivity(store, 'Created work order', `WO-${workOrder.id}`);
    return workOrder;
  });
}

export async function updateWorkOrderStatus(id: number, status: WorkOrder['status']) {
  return updateStore((store) => {
    const workOrder = store.workOrders.find((entry) => entry.id === id);
    if (!workOrder) {
      throw new Error('Work order not found.');
    }

    if (status === 'in_progress') {
      const bom = store.boms.find((entry) => entry.id === workOrder.bom_id);
      const shortages: string[] = [];

      if (bom) {
        for (const component of bom.components) {
          const required = component.quantity_required * workOrder.target_quantity;
          const stock = store.inventory.find((entry) => entry.sku === component.sku);

          if (!stock || stock.quantity < required) {
            shortages.push(`${component.sku} (need ${required}, have ${stock?.quantity ?? 0})`);
          }
        }
      }

      if (shortages.length > 0) {
        throw new Error(`Cannot start production. Insufficient stock: ${shortages.join(', ')}`);
      }
    }

    workOrder.status = status;
    if (status === 'in_progress') appendActivity(store, 'Started production', `WO-${id}`);
    return workOrder;
  });
}

export async function completeWorkOrder(id: number, actualYield?: NumericInput) {
  return updateStore((store) => {
    const workOrder = store.workOrders.find((entry) => entry.id === id);
    if (!workOrder) {
      throw new Error('Work order not found.');
    }

    if (workOrder.status === 'completed') {
      throw new Error('Work order is already completed.');
    }

    const bom = store.boms.find((entry) => entry.id === workOrder.bom_id);
    if (!bom) {
      throw new Error('BOM not found.');
    }

    const yieldQuantity = actualYield === undefined ? workOrder.target_quantity : normalizeNumber(actualYield, workOrder.target_quantity);
    const wastage = workOrder.target_quantity - yieldQuantity;
    const timestamp = new Date().toISOString();

    for (const component of bom.components) {
      const consumedQuantity = component.quantity_required * workOrder.target_quantity;
      const inventoryItem = store.inventory.find((entry) => entry.sku === component.sku);

      if (inventoryItem) {
        inventoryItem.quantity -= consumedQuantity;
        inventoryItem.last_updated = timestamp;
      }

      store.stockMovements.push({
        id: getNextId(store.stockMovements),
        item_sku: component.sku,
        movement_type: 'consumed',
        quantity_change: consumedQuantity,
        reference_id: workOrder.id,
        notes: `Consumed for WO-${workOrder.id}`,
        created_at: timestamp,
        user: _currentActor.name
      });
    }

    const finishedGood = ensureFinishedGood(store, bom.finished_sku, bom.name);
    finishedGood.quantity += yieldQuantity;
    finishedGood.last_updated = timestamp;

    store.stockMovements.push({
      id: getNextId(store.stockMovements),
      item_sku: bom.finished_sku,
      movement_type: 'manufactured',
      quantity_change: yieldQuantity,
      reference_id: workOrder.id,
      notes: wastage > 0 ? `Manufactured from WO-${workOrder.id} (Loss: ${wastage} units)` : `Manufactured from WO-${workOrder.id}`,
      created_at: timestamp,
      user: _currentActor.name
    });

    workOrder.status = 'completed';
    workOrder.completed_at = timestamp;
    workOrder.actual_yield = yieldQuantity;
    workOrder.wastage = wastage;
    appendActivity(store, `Completed batch (yield: ${yieldQuantity})`, `WO-${id}`);

    store.qualityChecks.push({
      id: getNextId(store.qualityChecks),
      work_order_id: workOrder.id,
      item_sku: bom.finished_sku,
      status: 'pending',
      defect_rate: 0,
      notes: '',
      inspected_at: null
    });

    return workOrder;
  });
}

export async function getQualityChecks() {
  return sortByTimestampDesc(
    selectStore((store) => store.qualityChecks),
    (check) => check.inspected_at ?? check.work_order_id.toString()
  );
}

export async function inspectQualityCheck(
  id: number,
  input: { status: QualityCheck['status']; defect_rate: NumericInput; notes: string }
) {
  return updateStore((store) => {
    const qualityCheck = store.qualityChecks.find((entry) => entry.id === id);
    if (!qualityCheck) {
      throw new Error('Quality check not found.');
    }

    qualityCheck.status = input.status;
    qualityCheck.defect_rate = normalizeNumber(input.defect_rate, 0);
    qualityCheck.notes = normalizeText(input.notes, '');
    qualityCheck.inspected_at = new Date().toISOString();
    appendActivity(store, `QC inspection: ${input.status}`, `QC-${id}`);
    return qualityCheck;
  });
}

export async function getSuppliers() {
  return sortByTimestampDesc(selectStore((store) => store.suppliers), (supplier) => supplier.created_at);
}

export async function createSupplier(input: Omit<Supplier, 'id' | 'created_at'>) {
  return updateStore((store) => {
    const supplier: Supplier = {
      id: getNextId(store.suppliers),
      name: normalizeText(input.name, 'New Supplier'),
      email: input.email || null,
      phone: input.phone || null,
      created_at: new Date().toISOString()
    };

    store.suppliers.push(supplier);
    appendActivity(store, 'Added supplier', supplier.name);
    return supplier;
  });
}

export async function getPurchaseOrders() {
  return sortByTimestampDesc(selectStore((store) => store.purchaseOrders), (purchaseOrder) => purchaseOrder.created_at);
}

export async function createPurchaseOrder(input: {
  supplier_id: NumericInput;
  required_sku: string;
  quantity: NumericInput;
  expected_cost: NumericInput;
}) {
  return updateStore((store) => {
    const purchaseOrder: PurchaseOrder = {
      id: getNextId(store.purchaseOrders),
      supplier_id: normalizeNumber(input.supplier_id),
      required_sku: normalizeText(input.required_sku, ''),
      quantity: normalizeNumber(input.quantity, 0),
      expected_cost: normalizeNumber(input.expected_cost, 0),
      status: 'draft',
      created_at: new Date().toISOString()
    };

    store.purchaseOrders.push(purchaseOrder);
    return purchaseOrder;
  });
}

export async function receivePurchaseOrder(id: number) {
  return updateStore((store) => {
    const purchaseOrder = store.purchaseOrders.find((entry) => entry.id === id);
    if (!purchaseOrder) {
      throw new Error('Purchase order not found.');
    }

    if (purchaseOrder.status === 'received') {
      throw new Error('Purchase order is already received.');
    }

    const timestamp = new Date().toISOString();
    const inventoryItem = ensureRawMaterial(store, purchaseOrder);
    inventoryItem.quantity += purchaseOrder.quantity;
    inventoryItem.last_updated = timestamp;

    store.stockMovements.push({
      id: getNextId(store.stockMovements),
      item_sku: purchaseOrder.required_sku,
      movement_type: 'inward',
      quantity_change: purchaseOrder.quantity,
      reference_id: purchaseOrder.id,
      notes: `Received from PO-${purchaseOrder.id}`,
      created_at: timestamp,
      user: _currentActor.name
    });

    appendActivity(store, 'Received purchase order', `PO-${id}`);
    purchaseOrder.status = 'received';
    purchaseOrder.received_at = timestamp;

    return purchaseOrder;
  });
}

export async function getWarehouses() {
  return selectStore((store) => store.warehouses);
}

export async function getStockTransfers() {
  return sortByTimestampDesc(selectStore((store) => store.stockTransfers), (transfer) => transfer.requested_at);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  return selectStore((store) => {
    const orders = store.orders.map((order) => hydrateOrder(order, store.clients));
    const quotations = store.quotations.map((quotation) => hydrateQuotation(quotation, store.clients));

    return {
      totalOrders: orders.length,
      inProduction: orders.filter((order) => order.status === 'in_production').length,
      delayedOrders: orders.filter((order) => order.status !== 'delivered' && order.deadline && getTimestamp(order.deadline) < Date.now()).length,
      totalClients: store.clients.length,
      basicRevenue: quotations
        .filter((quotation) => quotation.status === 'accepted' || quotation.status === 'approved')
        .reduce((sum, quotation) => sum + quotation.total_amount, 0),
      activityData: createActivityData(store)
    };
  });
}

export async function getReportingData(): Promise<ReportingSnapshot> {
  return selectStore((store) => {
    // Build actual order counts per month key (YYYY-MM)
    const actualByKey = new Map<string, number>();
    for (const order of store.orders) {
      const sourceDate = order.created_at || order.deadline;
      if (!sourceDate) continue;
      const d = new Date(sourceDate);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      actualByKey.set(key, (actualByKey.get(key) ?? 0) + 1);
    }

    // Synthetic baseline counts for months without real data (realistic ramp-up)
    const syntheticCounts = [8, 11, 9, 14, 12, 17];

    // Build 6-month window ending at current month
    const now = new Date();
    const orderTrends: { name: string; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(d);
      const actual = actualByKey.get(key);
      orderTrends.push({ name: label, orders: actual ?? syntheticCounts[5 - i] });
    }

    const inventoryByCategory = [
      {
        name: 'Raw Materials',
        value: store.inventory
          .filter((item) => item.category === 'raw')
          .reduce((sum, item) => sum + item.quantity * item.cost, 0)
      },
      {
        name: 'Finished Goods',
        value: store.inventory
          .filter((item) => item.category === 'finished')
          .reduce((sum, item) => sum + item.quantity * item.cost, 0)
      }
    ];

    const completedQualityChecks = store.qualityChecks.filter((check) => check.status !== 'pending');
    const passedQualityChecks = completedQualityChecks.filter((check) => check.status === 'passed').length;

    return {
      orderTrends,
      inventoryValuation: store.inventory.reduce((sum, item) => sum + item.quantity * item.cost, 0),
      inventoryByCategory,
      qualityPassRate: completedQualityChecks.length === 0 ? 100 : (passedQualityChecks / completedQualityChecks.length) * 100,
      totalOrders: store.orders.length
    };
  });
}
