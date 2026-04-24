import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Layers, Edit, Trash2, Download } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { actionButtonStyles } from '../utils/ui';

type InventoryItem = {
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

type StockMovement = {
  id: number;
  item_sku: string;
  movement_type: string;
  quantity_change: number;
  notes: string;
  created_at: string;
  user: string;
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'finished' | 'movements'>('raw');
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'raw',
    quantity: '',
    unit: 'kg',
    reorder_point: '',
    cost: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const [invRes, movRes] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/inventory/movements')
      ]);
      setItems(Array.isArray(await invRes.clone().json()) ? await invRes.json() : []);
      setMovements(Array.isArray(await movRes.clone().json()) ? await movRes.json() : []);
    } catch (e) {
      console.error("Inventory fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ sku: '', name: '', category: activeTab === 'finished' ? 'finished' : 'raw', quantity: '', unit: 'kg', reorder_point: '', cost: '' });
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const adjustStock = async (id: number, quantity: number, action: 'add' | 'deduct') => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, action })
      });
      if (res.ok) fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (res.ok) fetchInventory();
    } catch (err) {
      console.error(err);
    }
  };

  const exportCSV = () => {
    // Basic CSV Export
    const headers = ['SKU', 'Name', 'Category', 'Quantity', 'Unit', 'Unit Cost', 'Total Value'];
    const rows = items.map(i => [i.sku, i.name, i.category, i.quantity, i.unit, i.cost, i.quantity * i.cost]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = items.filter(item => item.category === activeTab);
  const lowStockCount = items.filter(item => item.quantity <= item.reorder_point).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Management</h2>
          <p className="text-sm text-slate-500 font-medium">Track raw materials and finished goods</p>
        </div>
        <button 
          onClick={() => {
            setFormData(prev => ({ ...prev, category: activeTab }));
            setIsModalOpen(true);
          }} 
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg"><Layers className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Items tracked</p>
            <p className="text-2xl font-bold text-slate-900">{items.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Low Stock Alerts</p>
            <p className="text-2xl font-bold text-slate-900">{lowStockCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Package className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Total Valuation</p>
            <p className="text-2xl font-bold text-slate-900">
              ${items.reduce((acc, item) => acc + (item.quantity * item.cost), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 relative">
          <div className="flex gap-6 relative z-10 w-full sm:w-auto">
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'raw' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('raw')}
            >
              Raw Materials
            </button>
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'finished' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('finished')}
            >
              Finished Goods
            </button>
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'movements' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('movements')}
            >
              Stock Audit Logs
            </button>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Change Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Operator</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{format(parseISO(m.created_at), 'MMM d, yyyy HH:mm')}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-slate-900">{m.item_sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx("px-2 py-0.5 rounded text-xs font-bold uppercase", 
                        m.movement_type === 'inward' || m.movement_type === 'manufactured' ? "bg-slate-100 border border-slate-200 text-slate-700" :
                        m.movement_type === 'outward' || m.movement_type === 'consumed' ? "bg-slate-100 border border-slate-200 text-slate-700" :
                        "bg-slate-100 text-slate-700"
                      )}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {(m.movement_type === 'inward' || m.movement_type === 'manufactured') ? '+' : '-'}{m.quantity_change}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{m.notes}</td>
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
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading inventory...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No items found in this category.</td></tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.reorder_point;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
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
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-slate-700 border border-red-200">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-slate-700 border border-green-200">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">${(item.quantity * item.cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                        <div className="text-xs text-slate-500 mt-0.5">${item.cost.toFixed(2)} / {item.unit}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => adjustStock(item.id, 10, 'deduct')}
                            className={clsx("p-1 px-2 text-xs font-bold rounded", actionButtonStyles.warning)}
                          >
                            -10
                          </button>
                          <button
                            onClick={() => adjustStock(item.id, 10, 'add')}
                            className={clsx("p-1 px-2 text-xs font-bold rounded", actionButtonStyles.successSubtle)}
                          >
                            +10
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className={clsx("p-1 ml-2 rounded", actionButtonStyles.danger)}
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto w-full">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <form onSubmit={handleCreateItem}>
              <div className="px-6 py-5 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Add Inventory Item</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">SKU *</label>
                    <input required type="text" placeholder="e.g. RESIN-01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Category</label>
                    <select className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                      <option value="raw">Raw Material</option>
                      <option value="finished">Finished Good</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Item Name *</label>
                  <input required type="text" placeholder="e.g. High Density Polyethylene (HDPE)" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>
                    <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Unit *</label>
                    <input required type="text" placeholder="kg, pieces, etc." className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cost / Unit *</label>
                    <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Low Stock Alert (Reorder Point) *</label>
                  <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={formData.reorder_point} onChange={e => setFormData({...formData, reorder_point: e.target.value})} />
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
