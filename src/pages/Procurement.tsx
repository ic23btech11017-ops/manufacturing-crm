import React, { useState, useEffect } from 'react';
import { Truck, Store } from 'lucide-react';
import clsx from 'clsx';
import { actionButtonStyles, statusToneStyles } from '../utils/ui';
import {
  createPurchaseOrder,
  createSupplier,
  getInventory,
  getPurchaseOrders,
  getSuppliers,
  receivePurchaseOrder,
  subscribeToDemoStore
} from '../demo/store';

export default function Procurement() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [pos, setPos] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pos' | 'suppliers'>('pos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poForm, setPoForm] = useState({ supplier_id: '', required_sku: '', quantity: '', expected_cost: '' });

  const [isSupModalOpen, setIsSupModalOpen] = useState(false);
  const [supForm, setSupForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    void fetchData();

    return subscribeToDemoStore(() => {
      void fetchData();
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [supplierData, poData, inventoryData] = await Promise.all([
        getSuppliers(),
        getPurchaseOrders(),
        getInventory()
      ]);

      setSuppliers(supplierData);
      setPos(poData);
      setInventory(inventoryData);
      setError(null);
    } catch (err) {
      console.error('Procurement demo data load failed:', err);
      setSuppliers([]);
      setPos([]);
      setInventory([]);
      setError('Procurement demo data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupplier(supForm);
      setIsSupModalOpen(false);
      setSupForm({ name: '', email: '', phone: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create supplier.');
    }
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPurchaseOrder(poForm);
      setIsPoModalOpen(false);
      setPoForm({ supplier_id: '', required_sku: '', quantity: '', expected_cost: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create purchase order.');
    }
  };

  const completePo = async (id: number) => {
    if (!confirm('Receive Goods? This will instantly add stock to Inventory and log the Stock Movement inward.')) return;
    try {
      await receivePurchaseOrder(id);
    } catch (err) {
      console.error(err);
      alert('Failed to receive goods.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Procurement</h2>
          <p className="text-sm text-slate-500 font-medium">Manage Suppliers and Purchase Orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsSupModalOpen(true)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <Store className="w-4 h-4" /> Add Supplier
          </button>
          <button onClick={() => setIsPoModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <Truck className="w-4 h-4" /> Create PO
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-6 relative z-10 w-full">
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'pos' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('pos')}
            >
              Purchase Orders
            </button>
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'suppliers' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('suppliers')}
            >
              Supplier Directory
            </button>
          </div>
        </div>

        {error && (
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm font-medium text-amber-800">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {activeTab === 'pos' ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">PO ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Requirements</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Loading purchase orders...
                    </td>
                  </tr>
                )}
                {pos.map(po => {
                  const supplier = suppliers.find(s => s.id === po.supplier_id);
                  return (
                    <tr key={po.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">PO-{String(po.id).padStart(4,'0')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{supplier?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{po.quantity}x {po.required_sku}</div>
                        <div className="text-xs text-slate-500">Est Cost: ₹{po.expected_cost}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase",
                          po.status === 'received'
                            ? statusToneStyles.received
                            : po.status === 'approved'
                              ? statusToneStyles.sent
                              : statusToneStyles.draft
                        )}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {po.status !== 'received' && (
                          <button
                            onClick={() => completePo(po.id)}
                            className={clsx("px-3 py-1.5 rounded text-xs font-bold", actionButtonStyles.success)}
                          >
                            Receive Goods
                          </button>
                        )}
                        {po.status === 'received' && (
                          <span className="text-xs text-slate-500 italic">In Inventory</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {!loading && pos.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No Purchase Orders found.</td></tr>}
              </tbody>
            </table>
          ) : (
             <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Company Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                      Loading suppliers...
                    </td>
                  </tr>
                )}
                {suppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900">{sup.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{sup.email}</div>
                      <div className="text-sm text-slate-500">{sup.phone}</div>
                    </td>
                  </tr>
                ))}
                {!loading && suppliers.length === 0 && <tr><td colSpan={2} className="px-6 py-8 text-center text-slate-500">No Suppliers found.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isPoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto w-full">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsPoModalOpen(false)}></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <form onSubmit={handleCreatePo}>
              <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-xl font-bold text-slate-900">Create Purchase Order</h3></div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Supplier</label>
                  <select required className="block w-full rounded-md border border-slate-300 py-2 border-r-8 border-transparent px-3 text-sm focus:ring-slate-900 bg-white" value={poForm.supplier_id} onChange={e => setPoForm({...poForm, supplier_id: e.target.value})}>
                    <option value="" disabled>Select Supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">SKU to Request</label>
                  <select required className="block w-full rounded-md border border-slate-300 py-2 border-r-8 border-transparent px-3 text-sm focus:ring-slate-900 bg-white" value={poForm.required_sku} onChange={e => setPoForm({...poForm, required_sku: e.target.value})}>
                    <option value="" disabled>Select Raw Material...</option>
                    {inventory.filter(i => i.category === 'raw').map(i => <option key={i.sku} value={i.sku}>{i.name} ({i.sku})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity Requested</label>
                    <input required type="number" min="0.01" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={poForm.quantity} onChange={e => setPoForm({...poForm, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Expected Cost (Total)</label>
                    <input required type="number" step="0.01" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={poForm.expected_cost} onChange={e => setPoForm({...poForm, expected_cost: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsPoModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">Save PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto w-full">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsSupModalOpen(false)}></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <form onSubmit={handleCreateSupplier}>
              <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-xl font-bold text-slate-900">Add Supplier</h3></div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                  <input required type="text" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={supForm.name} onChange={e => setSupForm({...supForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input required type="email" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={supForm.email} onChange={e => setSupForm({...supForm, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
                  <input required type="text" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={supForm.phone} onChange={e => setSupForm({...supForm, phone: e.target.value})} />
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsSupModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
