import React, { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle, Search, Layers, ClipboardList } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type BOM = {
  id: number;
  finished_sku: string;
  name: string;
  components: { sku: string, quantity_required: number }[];
  created_at: string;
};

  type WorkOrder = {
    id: number;
    bom_id: number;
    target_quantity: number;
    status: 'planned' | 'in_progress' | 'completed';
    created_at: string;
    completed_at?: string;
  };

type InventoryItem = {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
};

export default function Production() {
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'work_orders' | 'boms'>('work_orders');

  // Modals
  const [isWbModalOpen, setIsWbModalOpen] = useState(false);
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);

  // Forms
  const [woForm, setWoForm] = useState({ bom_id: '', target_quantity: '' });
  const [bomForm, setBomForm] = useState({ finished_sku: '', name: '' });
  const [bomComponents, setBomComponents] = useState([{ sku: '', quantity_required: '' }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, wRes, iRes] = await Promise.all([
        fetch('/api/production/boms'),
        fetch('/api/production/work-orders'),
        fetch('/api/inventory')
      ]);
      setBoms(Array.isArray(await bRes.clone().json()) ? await bRes.json() : []);
      setWorkOrders(Array.isArray(await wRes.clone().json()) ? await wRes.json() : []);
      setInventory(Array.isArray(await iRes.clone().json()) ? await iRes.json() : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/production/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(woForm)
      });
      if (res.ok) {
        setIsWbModalOpen(false);
        setWoForm({ bom_id: '', target_quantity: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validComponents = bomComponents.filter(c => c.sku && c.quantity_required).map(c => ({
        sku: c.sku,
        quantity_required: parseFloat(c.quantity_required)
      }));

      const res = await fetch('/api/production/boms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bomForm,
          components: validComponents
        })
      });
      if (res.ok) {
        setIsBomModalOpen(false);
        setBomForm({ finished_sku: '', name: '' });
        setBomComponents([{ sku: '', quantity_required: '' }]);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const changeWorkOrderStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/production/work-orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  const completeWorkOrder = async (id: number) => {
    const rawYield = prompt('Execute Work Order?\n\nPlease enter the ACTUAL yield out of Production (to trace wastage/loss). Leave blank to use target quantity:');
    if (rawYield === null) return; // User cancelled

    const payload: any = {};
    if (rawYield.trim() !== '') {
      payload.actual_yield = parseInt(rawYield, 10);
      if (isNaN(payload.actual_yield)) {
        alert('Invalid yield quantity');
        return;
      }
    }

    try {
      const res = await fetch(`/api/production/work-orders/${id}/complete`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const finishedGoods = inventory.filter(i => i.category === 'finished');
  const rawMaterials = inventory.filter(i => i.category === 'raw');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Production Control</h2>
          <p className="text-sm text-slate-500 font-medium">Manage Work Orders and Bill of Materials (BOM)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsBomModalOpen(true)} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" /> New BOM
          </button>
          <button onClick={() => setIsWbModalOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
            <ClipboardList className="w-4 h-4" /> New Work Order
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="flex gap-6 relative z-10">
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'work_orders' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('work_orders')}
            >
              Active Work Orders
            </button>
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'boms' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('boms')}
            >
              Bill of Materials (BOM)
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'work_orders' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workOrders.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">No active work orders.</div>
              ) : (
                workOrders.map((wo) => {
                  const bom = boms.find(b => b.id === wo.bom_id);
                  return (
                    <div key={wo.id} className="border border-slate-200 rounded-xl p-5 shadow-sm bg-white flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WO-{wo.id.toString().padStart(4, '0')}</span>
                          <h4 className="font-bold text-slate-900 mt-0.5">{bom?.name || 'Unknown BOM'}</h4>
                        </div>
                        <span className={clsx("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase", 
                          wo.status === 'completed' ? "bg-slate-100 border border-slate-200 text-slate-700" : 
                          wo.status === 'in_progress' ? "bg-slate-100 border border-slate-200 text-slate-700" : 
                          "bg-slate-100 text-blue-700"
                        )}>
                          {wo.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-700">Target Output:</p>
                        <p className="text-2xl font-extrabold text-slate-900">{wo.target_quantity.toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span></p>
                        {wo.status === 'completed' && wo.wastage !== undefined && (
                          <p className="text-xs font-bold text-slate-500 mt-1">
                            Actual Yield: <span className="text-slate-900">{wo.actual_yield}</span> | Loss: <span className="text-red-700">{wo.wastage}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100">
                        {wo.status === 'planned' ? (
                          <button onClick={() => changeWorkOrderStatus(wo.id, 'in_progress')} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <Play className="w-4 h-4" /> Start Production
                          </button>
                        ) : wo.status === 'in_progress' ? (
                          <button onClick={() => completeWorkOrder(wo.id)} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                            <CheckCircle className="w-4 h-4" /> Finish & Run Deductions
                          </button>
                        ) : (
                          <button onClick={() => alert(`Batch Trace Link\nWO ID: ${wo.id}\nTarget: ${wo.target_quantity}\nYield: ${wo.actual_yield}\nRaw Materials Consumed: View full stock movements tab for WO-${wo.id}`)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                            <CheckCircle className="w-4 h-4 text-slate-600" /> Trace Batch #{wo.id}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {boms.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500">No BOMs configured yet.</div>
              ) : (
                boms.map((bom) => (
                  <div key={bom.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900">{bom.name}</h4>
                        <span className="text-xs font-mono font-bold text-slate-500 tracking-wider">SKU: {bom.finished_sku}</span>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 gap-2 flex items-center"><Layers className="w-4 h-4" /> Recipe Components:</p>
                      <ul className="space-y-2">
                        {bom.components.map((comp, idx) => {
                          const item = inventory.find(i => i.sku === comp.sku);
                          return (
                            <li key={idx} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                              <div className="flex gap-2 items-center">
                                <span className="font-mono text-xs text-slate-400">{comp.sku}</span>
                                <span className="font-semibold text-slate-700">{item?.name || 'Unknown'}</span>
                              </div>
                              <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">{comp.quantity_required} {item?.unit || 'x'}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Work Order Modal */}
      {isWbModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsWbModalOpen(false)}></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <form onSubmit={handleCreateWO}>
              <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-xl font-bold text-slate-900">Create Work Order</h3></div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Select BOM (Recipe)</label>
                  <select required className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-sm focus:ring-slate-900 bg-white" value={woForm.bom_id} onChange={e => setWoForm({...woForm, bom_id: e.target.value})}>
                    <option value="" disabled>Select Bill of Materials...</option>
                    {boms.map(b => <option key={b.id} value={b.id}>{b.name} (FG: {b.finished_sku})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Production Quantity</label>
                  <input required type="number" min="1" className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-sm focus:ring-slate-900" value={woForm.target_quantity} onChange={e => setWoForm({...woForm, target_quantity: e.target.value})} />
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsWbModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">Start Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New BOM Modal */}
      {isBomModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsBomModalOpen(false)}></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-8">
            <form onSubmit={handleCreateBOM}>
              <div className="px-6 py-5 border-b border-slate-200"><h3 className="text-xl font-bold text-slate-900">Define Bill of Materials</h3></div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Finished Product</label>
                    <select required className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900 bg-white" value={bomForm.finished_sku} onChange={e => setBomForm({...bomForm, finished_sku: e.target.value})}>
                      <option value="" disabled>Select Finished Good...</option>
                      {finishedGoods.map(g => <option key={g.sku} value={g.sku}>{g.name} ({g.sku})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">BOM Version Name</label>
                    <input required type="text" placeholder="e.g. Standard Mix v1" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={bomForm.name} onChange={e => setBomForm({...bomForm, name: e.target.value})} />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200 mt-6">
                  <h4 className="text-sm font-bold text-slate-900 mb-3">Raw Material Composition</h4>
                  {bomComponents.map((comp, index) => (
                    <div key={index} className="flex gap-4 mb-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Raw Material SKU</label>
                        <select required className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900 bg-white" value={comp.sku} onChange={(e) => {
                          const newComps = [...bomComponents];
                          newComps[index].sku = e.target.value;
                          setBomComponents(newComps);
                        }}>
                          <option value="" disabled>Select Material...</option>
                          {rawMaterials.map(r => <option key={r.sku} value={r.sku}>{r.name} ({r.sku})</option>)}
                        </select>
                      </div>
                      <div className="w-32">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Qty Required</label>
                        <input required type="number" step="0.001" placeholder="0.5" className="block w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:ring-slate-900" value={comp.quantity_required} onChange={(e) => {
                          const newComps = [...bomComponents];
                          newComps[index].quantity_required = e.target.value;
                          setBomComponents(newComps);
                        }} />
                      </div>
                      <button type="button" onClick={() => setBomComponents(bomComponents.filter((_, i) => i !== index))} className="p-2 bg-red-50 text-slate-900 rounded hover:bg-slate-100 border border-slate-200">
                        X
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setBomComponents([...bomComponents, { sku: '', quantity_required: '' }])} className="text-sm font-bold text-slate-900 hover:text-slate-800 mt-2">
                    + Add Component
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsBomModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">Save BOM</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
