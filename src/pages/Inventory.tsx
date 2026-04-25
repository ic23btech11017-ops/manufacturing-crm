import React, { useState, useEffect, type FormEvent } from 'react';
import { Package, Plus, AlertTriangle, Layers, Trash2, Download, ShoppingCart, XCircle, Scale, ArrowRightLeft, X, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { actionButtonStyles } from '../utils/ui';
import {
  adjustInventoryItem,
  createInventoryItem,
  createPurchaseOrder,
  createStockTransfer,
  deleteInventoryItem,
  getInventory,
  getStockMovements,
  getSuppliers,
  getWarehouses,
  subscribeToDemoStore,
  writeOffInventory,
} from '../demo/store';

type InventoryItem = {
  id: number; sku: string; name: string; category: 'raw' | 'finished';
  quantity: number; unit: string; reorder_point: number; cost: number; last_updated: string;
};
type StockMovement = {
  id: number; item_sku: string; movement_type: string;
  quantity_change: number; notes: string; created_at: string; user: string;
};
type Supplier  = { id: number; name: string };
type Warehouse = { id: number; name: string; location: string };

// ── small helpers ──────────────────────────────────────────────
const WRITE_OFF_REASONS = ['Damaged', 'Expired', 'Quality Rejection', 'Theft / Loss', 'Other'];

function ModalShell({ title, subtitle, icon: Icon, onClose, children }: {
  title: string; subtitle?: string; icon: React.ElementType; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg"><Icon className="w-5 h-5 text-slate-700" /></div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Reorder modal ──────────────────────────────────────────────
function ReorderModal({ item, suppliers, onClose }: { item: InventoryItem; suppliers: Supplier[]; onClose: () => void }) {
  const suggested = Math.max(item.reorder_point * 2 - item.quantity, item.reorder_point);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id?.toString() ?? '');
  const [qty, setQty]               = useState(String(suggested));
  const [cost, setCost]             = useState(String((suggested * item.cost).toFixed(2)));
  const [done, setDone]             = useState(false);
  const [err, setErr]               = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supplierId) { setErr('Select a supplier.'); return; }
    try {
      await createPurchaseOrder({ supplier_id: supplierId, required_sku: item.sku, quantity: qty, expected_cost: cost });
      setDone(true);
    } catch { setErr('Failed to raise purchase order.'); }
  };

  if (done) return (
    <ModalShell title="Reorder Raised" icon={ShoppingCart} onClose={onClose}>
      <div className="p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto">
          <ShoppingCart className="w-6 h-6 text-green-600" />
        </div>
        <p className="font-semibold text-slate-900">Purchase order created</p>
        <p className="text-sm text-slate-500">{qty} {item.unit} of <strong>{item.sku}</strong> has been sent to Procurement.</p>
        <button onClick={onClose} className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800">Done</button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell title="Raise Reorder" subtitle={`${item.name} · ${item.sku}`} icon={ShoppingCart} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-5 space-y-4">
          {/* Stock snapshot */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg border border-slate-200 p-3 text-center text-xs">
            <div><p className="text-slate-500 font-medium">Current Stock</p><p className="font-bold text-slate-900 text-base mt-0.5">{item.quantity.toLocaleString()} <span className="font-normal text-slate-400">{item.unit}</span></p></div>
            <div><p className="text-slate-500 font-medium">Reorder Point</p><p className="font-bold text-amber-700 text-base mt-0.5">{item.reorder_point} <span className="font-normal text-slate-400">{item.unit}</span></p></div>
            <div><p className="text-slate-500 font-medium">Suggested Qty</p><p className="font-bold text-green-700 text-base mt-0.5">{suggested} <span className="font-normal text-slate-400">{item.unit}</span></p></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier *</label>
            <select required className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="" disabled>Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity ({item.unit}) *</label>
              <input required type="number" min="1" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                value={qty} onChange={e => { setQty(e.target.value); setCost((parseFloat(e.target.value) * item.cost).toFixed(2)); }} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Est. Cost (₹)</label>
              <input type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
                value={cost} onChange={e => setCost(e.target.value)} />
            </div>
          </div>
          {err && <p className="text-sm text-red-600 font-medium">{err}</p>}
        </div>
        <div className="bg-slate-50 px-5 py-4 flex justify-end gap-2 rounded-b-xl border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" /> Raise PO
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Write-Off modal ────────────────────────────────────────────
function WriteOffModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [qty, setQty]       = useState('');
  const [reason, setReason] = useState(WRITE_OFF_REASONS[0]);
  const [notes, setNotes]   = useState('');
  const [err, setErr]       = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const n = parseFloat(qty);
    if (!n || n <= 0) { setErr('Enter a valid quantity.'); return; }
    if (n > item.quantity) { setErr(`Cannot write off more than current stock (${item.quantity} ${item.unit}).`); return; }
    try {
      await writeOffInventory(item.id, qty, reason, notes);
      onClose();
    } catch (ex: any) { setErr(ex.message ?? 'Failed to write off stock.'); }
  };

  return (
    <ModalShell title="Write-Off Stock" subtitle={`${item.name} · ${item.sku}`} icon={XCircle} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
            <span className="text-slate-600 font-medium">Current stock</span>
            <span className="font-bold text-slate-900">{item.quantity.toLocaleString()} {item.unit}</span>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Reason *</label>
            <select className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
              value={reason} onChange={e => setReason(e.target.value)}>
              {WRITE_OFF_REASONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity to write off ({item.unit}) *</label>
            <input required type="number" min="1" max={item.quantity} step="0.01"
              className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
              placeholder={`Max ${item.quantity}`} value={qty} onChange={e => { setQty(e.target.value); setErr(''); }} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea rows={2} className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none resize-none"
              placeholder="e.g. Batch rejected during QC, moisture damage…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {err && <p className="text-sm text-red-600 font-medium">{err}</p>}
        </div>
        <div className="bg-slate-50 px-5 py-4 flex justify-end gap-2 rounded-b-xl border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Confirm Write-Off
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Reconcile modal ────────────────────────────────────────────
function ReconcileModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [actual, setActual] = useState(String(item.quantity));
  const [notes, setNotes]   = useState('');
  const [err, setErr]       = useState('');
  const diff = parseFloat(actual) - item.quantity;
  const isValid = !isNaN(parseFloat(actual)) && parseFloat(actual) >= 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) { setErr('Enter a valid count.'); return; }
    try {
      await adjustInventoryItem(item.id, actual, 'set');
      onClose();
    } catch (ex: any) { setErr(ex.message ?? 'Failed to reconcile.'); }
  };

  return (
    <ModalShell title="Stock Reconciliation" subtitle={`${item.name} · ${item.sku}`} icon={Scale} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-xs">
            <div><p className="text-slate-500 font-medium">System Count</p><p className="text-xl font-extrabold text-slate-900 mt-0.5">{item.quantity.toLocaleString()}</p><p className="text-slate-400">{item.unit}</p></div>
            <div>
              <p className="text-slate-500 font-medium">Variance</p>
              <p className={clsx("text-xl font-extrabold mt-0.5", isValid && diff !== 0 ? (diff > 0 ? "text-green-600" : "text-red-600") : "text-slate-400")}>
                {isValid ? (diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)) : '—'}
              </p>
              <p className="text-slate-400">{item.unit}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Actual physical count ({item.unit}) *</label>
            <input required type="number" min="0" step="0.01"
              className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
              value={actual} onChange={e => { setActual(e.target.value); setErr(''); }} autoFocus />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes <span className="font-normal text-slate-400">(optional)</span></label>
            <textarea rows={2} className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none resize-none"
              placeholder="e.g. Annual physical count, storage area B3…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          {isValid && diff !== 0 && (
            <p className={clsx("text-xs font-semibold px-3 py-2 rounded-md", diff > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
              {diff > 0 ? `▲ Surplus of ${diff.toFixed(2)} ${item.unit} will be added to stock.` : `▼ Deficit of ${Math.abs(diff).toFixed(2)} ${item.unit} will be deducted from stock.`}
            </p>
          )}
          {err && <p className="text-sm text-red-600 font-medium">{err}</p>}
        </div>
        <div className="bg-slate-50 px-5 py-4 flex justify-end gap-2 rounded-b-xl border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
          <button type="submit" disabled={!isValid} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Scale className="w-4 h-4" /> Apply Count
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Transfer modal ─────────────────────────────────────────────
function TransferModal({ item, warehouses, onClose }: { item: InventoryItem; warehouses: Warehouse[]; onClose: () => void }) {
  const [fromId, setFromId]   = useState(warehouses[0]?.id?.toString() ?? '');
  const [toId, setToId]       = useState(warehouses[1]?.id?.toString() ?? '');
  const [qty, setQty]         = useState('');
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (fromId === toId) { setErr('Source and destination must be different.'); return; }
    const n = parseFloat(qty);
    if (!n || n <= 0) { setErr('Enter a valid quantity.'); return; }
    if (n > item.quantity) { setErr(`Cannot transfer more than available stock (${item.quantity} ${item.unit}).`); return; }
    try {
      await createStockTransfer({ from_warehouse_id: parseInt(fromId), to_warehouse_id: parseInt(toId), item_sku: item.sku, quantity: qty });
      setDone(true);
    } catch (ex: any) { setErr(ex.message ?? 'Transfer failed.'); }
  };

  const toWarehouse = warehouses.find(w => w.id === parseInt(toId));

  if (done) return (
    <ModalShell title="Transfer Raised" icon={ArrowRightLeft} onClose={onClose}>
      <div className="p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-purple-50 border border-purple-200 rounded-full flex items-center justify-center mx-auto">
          <ArrowRightLeft className="w-6 h-6 text-purple-600" />
        </div>
        <p className="font-semibold text-slate-900">Transfer request created</p>
        <p className="text-sm text-slate-500">{qty} {item.unit} of <strong>{item.sku}</strong> queued for <strong>{toWarehouse?.name}</strong>.</p>
        <button onClick={onClose} className="mt-2 px-5 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800">Done</button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell title="Transfer Stock" subtitle={`${item.name} · ${item.sku}`} icon={ArrowRightLeft} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm">
            <span className="text-slate-500 font-medium">Available to transfer</span>
            <span className="font-bold text-slate-900">{item.quantity.toLocaleString()} {item.unit}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">From Warehouse *</label>
              <select required className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                value={fromId} onChange={e => setFromId(e.target.value)}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">To Warehouse *</label>
              <select required className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                value={toId} onChange={e => setToId(e.target.value)}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity ({item.unit}) *</label>
            <input required type="number" min="1" max={item.quantity} step="0.01"
              className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none"
              placeholder={`Max ${item.quantity}`} value={qty}
              onChange={e => { setQty(e.target.value); setErr(''); }} autoFocus />
          </div>
          {err && <p className="text-sm text-red-600 font-medium">{err}</p>}
        </div>
        <div className="bg-slate-50 px-5 py-4 flex justify-end gap-2 rounded-b-xl border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
          <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" /> Raise Transfer
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Main page ──────────────────────────────────────────────────
type TriggerModal =
  | { type: 'reorder';    item: InventoryItem }
  | { type: 'writeoff';   item: InventoryItem }
  | { type: 'reconcile';  item: InventoryItem }
  | { type: 'transfer';   item: InventoryItem }
  | null;

export default function Inventory() {
  const [items, setItems]         = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'finished' | 'movements'>('raw');
  const [trigger, setTrigger]     = useState<TriggerModal>(null);

  const [formData, setFormData] = useState({ sku: '', name: '', category: 'raw', quantity: '', unit: 'kg', reorder_point: '', cost: '' });

  useEffect(() => {
    void fetchAll();
    return subscribeToDemoStore(() => void fetchAll());
  }, []);

  const fetchAll = async () => {
    try {
      const [inv, mvt, sup, wh] = await Promise.all([getInventory(), getStockMovements(), getSuppliers(), getWarehouses()]);
      setItems(Array.isArray(inv) ? inv : []);
      setMovements(Array.isArray(mvt) ? mvt : []);
      setSuppliers(Array.isArray(sup) ? sup : []);
      setWarehouses(Array.isArray(wh) ? wh : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInventoryItem(formData as any);
      setIsAddOpen(false);
      setFormData({ sku: '', name: '', category: activeTab === 'finished' ? 'finished' : 'raw', quantity: '', unit: 'kg', reorder_point: '', cost: '' });
    } catch (err) { console.error(err); }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Delete this inventory item?')) return;
    try { await deleteInventoryItem(id); } catch (err) { console.error(err); }
  };

  const exportCSV = () => {
    const headers = ['SKU','Name','Category','Quantity','Unit','Unit Cost','Total Value'];
    const rows = items.map(i => [i.sku, i.name, i.category, i.quantity, i.unit, i.cost, i.quantity * i.cost]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csv);
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredItems  = items.filter(i => i.category === activeTab);
  const lowStockCount  = items.filter(i => i.quantity <= i.reorder_point).length;
  const criticalItems  = items.filter(i => i.category === 'raw' && i.quantity === 0);

  const movTypeStyle = (t: string) => {
    if (t === 'inward' || t === 'manufactured') return 'bg-green-50 text-green-700 border border-green-200';
    if (t === 'outward' || t === 'consumed')    return 'bg-red-50 text-red-700 border border-red-200';
    if (t === 'write_off')                      return 'bg-orange-50 text-orange-700 border border-orange-200';
    if (t === 'transfer_out')                   return 'bg-purple-50 text-purple-700 border border-purple-200';
    return 'bg-slate-100 text-slate-600 border border-slate-200';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Management</h2>
          <p className="text-sm text-slate-500 font-medium">Track raw materials and finished goods</p>
        </div>
        <button onClick={() => { setFormData(p => ({ ...p, category: activeTab })); setIsAddOpen(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Critical stock banner */}
      {criticalItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-800">
              {criticalItems.length} item{criticalItems.length > 1 ? 's' : ''} out of stock:{' '}
              <span className="font-bold">{criticalItems.map(i => i.sku).join(', ')}</span>
            </p>
          </div>
          <button onClick={() => setTrigger({ type: 'reorder', item: criticalItems[0] })}
            className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors shrink-0">
            Reorder Now →
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg"><Layers className="w-6 h-6 text-slate-700" /></div>
          <div><p className="text-sm font-semibold text-slate-500">Total Items tracked</p><p className="text-2xl font-bold text-slate-900">{items.length}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
          <div><p className="text-sm font-semibold text-slate-500">Low Stock Alerts</p><p className="text-2xl font-bold text-slate-900">{lowStockCount}</p></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg"><Package className="w-6 h-6 text-green-600" /></div>
          <div><p className="text-sm font-semibold text-slate-500">Total Valuation</p>
            <p className="text-2xl font-bold text-slate-900">₹{items.reduce((a, i) => a + i.quantity * i.cost, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Trigger legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
        <span className="font-bold text-slate-700">Row actions:</span>
        <span className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full"><ShoppingCart className="w-3 h-3" /> Reorder</span>
        <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3" /> Write-Off</span>
        <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full"><Scale className="w-3 h-3" /> Reconcile</span>
        <span className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full"><ArrowRightLeft className="w-3 h-3" /> Transfer</span>
      </div>

      {/* Table card */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-6 relative z-10 w-full sm:w-auto">
            {(['raw','finished','movements'] as const).map(tab => (
              <button key={tab}
                className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors capitalize whitespace-nowrap",
                  activeTab === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
                onClick={() => setActiveTab(tab)}>
                {tab === 'raw' ? 'Raw Materials' : tab === 'finished' ? 'Finished Goods' : 'Stock Audit Logs'}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-2 border border-slate-300 bg-white px-3 py-1.5 rounded-lg shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'movements' ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  {['Date & Time','SKU','Type','Change Qty','Notes','Operator'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format(parseISO(m.created_at), 'MMM d, yyyy HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-slate-900">{m.item_sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase", movTypeStyle(m.movement_type))}>{m.movement_type.replace('_',' ')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {['inward','manufactured'].includes(m.movement_type) ? '+' : '-'}{m.quantity_change}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{m.notes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{m.user}</td>
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No stock movements recorded.</td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU / Item</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Valuation</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading inventory…</td></tr>
                ) : filteredItems.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No items in this category.</td></tr>
                ) : filteredItems.map(item => {
                  const isLow = item.quantity <= item.reorder_point;
                  return (
                    <tr key={item.id} className={clsx("hover:bg-slate-50", isLow && "bg-amber-50/30")}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{item.sku}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-bold text-slate-900">{item.quantity.toLocaleString()}</span>
                          <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Reorder at: {item.reorder_point} {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">Healthy</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">₹{(item.quantity * item.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className="text-xs text-slate-500 mt-0.5">₹{item.cost.toFixed(2)} / {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5">
                          {/* Reorder — raw materials only */}
                          {item.category === 'raw' && (
                            <button title="Reorder" onClick={() => setTrigger({ type: 'reorder', item })}
                              className={clsx("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border",
                                isLow ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm" : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200")}>
                              <ShoppingCart className="w-3.5 h-3.5" />
                              {isLow ? 'Reorder!' : 'Reorder'}
                            </button>
                          )}
                          {/* Write-Off */}
                          <button title="Write-Off" onClick={() => setTrigger({ type: 'writeoff', item })}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                          {/* Reconcile */}
                          <button title="Reconcile (Physical Count)" onClick={() => setTrigger({ type: 'reconcile', item })}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 transition-colors">
                            <Scale className="w-4 h-4" />
                          </button>
                          {/* Transfer */}
                          <button title="Transfer to Warehouse" onClick={() => setTrigger({ type: 'transfer', item })}
                            className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 transition-colors">
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          {/* Delete */}
                          <button title="Delete" onClick={() => deleteItem(item.id)}
                            className={clsx("p-1.5 rounded-lg border transition-colors", actionButtonStyles.danger)}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Trigger modals ── */}
      {trigger?.type === 'reorder'   && <ReorderModal   item={trigger.item} suppliers={suppliers}   onClose={() => setTrigger(null)} />}
      {trigger?.type === 'writeoff'  && <WriteOffModal  item={trigger.item}                         onClose={() => setTrigger(null)} />}
      {trigger?.type === 'reconcile' && <ReconcileModal item={trigger.item}                         onClose={() => setTrigger(null)} />}
      {trigger?.type === 'transfer'  && <TransferModal  item={trigger.item} warehouses={warehouses} onClose={() => setTrigger(null)} />}

      {/* ── Add Item modal ── */}
      {isAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsAddOpen(false)} />
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <form onSubmit={handleCreateItem}>
              <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-xl font-bold text-slate-900">Add Inventory Item</h3></div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">SKU *</label>
                    <input required type="text" placeholder="e.g. RESIN-01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })}>
                      <option value="raw">Raw Material</option>
                      <option value="finished">Finished Good</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name *</label>
                  <input required type="text" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
                    <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Unit *</label>
                    <input required type="text" placeholder="kg, pcs…" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cost / Unit (₹) *</label>
                    <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Reorder Point *</label>
                  <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-2 focus:ring-slate-900 focus:outline-none" value={formData.reorder_point} onChange={e => setFormData({ ...formData, reorder_point: e.target.value })} />
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
