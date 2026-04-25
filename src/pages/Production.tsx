import React, { useState, useEffect } from 'react';
import { Settings, Play, CheckCircle, Search, Layers, ClipboardList, ArrowRight, ShieldCheck, Package, BarChart2, X } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { actionButtonStyles, statusToneStyles } from '../utils/ui';
import {
  completeWorkOrder as completeDemoWorkOrder,
  createBom,
  createWorkOrder,
  getBoms,
  getInventory,
  getWorkOrders,
  subscribeToDemoStore,
  updateWorkOrderStatus
} from '../demo/store';

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
  actual_yield?: number;
  wastage?: number;
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
  const navigate = useNavigate();
    // Custom modal state for trace and yield prompt
    const [traceModal, setTraceModal] = useState<{ open: boolean, wo?: WorkOrder }>({ open: false });
    const [yieldModal, setYieldModal] = useState<{ open: boolean, wo?: WorkOrder }>({ open: false });
    const [yieldInput, setYieldInput] = useState('');
    const [modalError, setModalError] = useState('');
    const [completionModal, setCompletionModal] = useState<{ open: boolean, wo?: WorkOrder, actualYield?: number, wastage?: number, bomName?: string }>({ open: false });
  const [boms, setBoms] = useState<BOM[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'work_orders' | 'boms'>('work_orders');
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isWbModalOpen, setIsWbModalOpen] = useState(false);
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);

  // Forms
  const [woForm, setWoForm] = useState({ bom_id: '', target_quantity: '' });
  const [bomForm, setBomForm] = useState({ finished_sku: '', name: '' });
  const [bomComponents, setBomComponents] = useState([{ sku: '', quantity_required: '' }]);

  useEffect(() => {
    void fetchData();

    return subscribeToDemoStore(() => {
      void fetchData();
    });
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bomData, workOrderData, inventoryData] = await Promise.all([
        getBoms(),
        getWorkOrders(),
        getInventory()
      ]);

      setBoms(bomData);
      setWorkOrders(workOrderData);
      setInventory(inventoryData);
      setError(null);
    } catch (err) {
      console.error('Production demo data load failed:', err);
      setBoms([]);
      setWorkOrders([]);
      setInventory([]);
      setError('Production demo data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWorkOrder(woForm);
      setIsWbModalOpen(false);
      setWoForm({ bom_id: '', target_quantity: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to create work order.');
    }
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validComponents = bomComponents.filter(c => c.sku && c.quantity_required).map(c => ({
        sku: c.sku,
        quantity_required: parseFloat(c.quantity_required)
      }));

      await createBom({
        ...bomForm,
        components: validComponents
      });
      setIsBomModalOpen(false);
      setBomForm({ finished_sku: '', name: '' });
      setBomComponents([{ sku: '', quantity_required: '' }]);
    } catch (err) {
      console.error(err);
      alert('Failed to create BOM.');
    }
  };

  const changeWorkOrderStatus = async (id: number, status: string) => {
    try {
      await updateWorkOrderStatus(id, status as WorkOrder['status']);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error updating status');
    }
  };

  const completeWorkOrder = async (id: number) => {
    // Open custom modal for yield input
    const wo = workOrders.find(w => w.id === id);
    setYieldInput('');
    setModalError('');
    setYieldModal({ open: true, wo });
  };

  // Handler for confirming yield modal
  const handleYieldConfirm = async () => {
    const id = yieldModal.wo?.id;
    const wo = yieldModal.wo;
    if (!id || !wo) return;
    let actual_yield: number | undefined = undefined;
    if (yieldInput.trim() !== '') {
      actual_yield = parseInt(yieldInput, 10);
      if (isNaN(actual_yield)) {
        setModalError('Invalid yield quantity');
        return;
      }
    }
    try {
      await completeDemoWorkOrder(id, actual_yield);
      const bom = boms.find(b => b.id === wo.bom_id);
      const resolvedYield = actual_yield ?? wo.target_quantity;
      setYieldModal({ open: false });
      setCompletionModal({
        open: true,
        wo,
        actualYield: resolvedYield,
        wastage: Math.max(0, wo.target_quantity - resolvedYield),
        bomName: bom?.name ?? 'Unknown BOM'
      });
    } catch (err) {
      setModalError('Failed to complete work order.');
    }
  };

  // Handler for closing yield modal
  const handleYieldCancel = () => {
    setYieldModal({ open: false });
    setModalError('');
  };

  // Handler for opening trace modal
  const handleTraceModal = (wo: WorkOrder) => {
    setTraceModal({ open: true, wo });
  };

  // Handler for closing trace modal
  const handleTraceClose = () => {
    setTraceModal({ open: false });
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

        {error && (
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-3 text-sm font-medium text-amber-800">
            {error}
          </div>
        )}

        <div className="p-6">
          {activeTab === 'work_orders' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-12 text-slate-500">Loading work orders...</div>
              ) : workOrders.length === 0 ? (
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
                          wo.status === 'completed' ? statusToneStyles.completed : 
                          wo.status === 'in_progress' ? statusToneStyles.in_progress : 
                          statusToneStyles.planned
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
                          <button
                            onClick={() => changeWorkOrderStatus(wo.id, 'in_progress')}
                            className={clsx("w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2", actionButtonStyles.info)}
                          >
                            <Play className="w-4 h-4" /> Start Production
                          </button>
                        ) : wo.status === 'in_progress' ? (
                          <button
                            onClick={() => completeWorkOrder(wo.id)}
                            className={clsx("w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2", actionButtonStyles.success)}
                          >
                            <CheckCircle className="w-4 h-4" /> Finish & Run Deductions
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTraceModal(wo)}
                            className={clsx("w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2", actionButtonStyles.neutral)}
                          >
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
              {loading ? (
                <div className="col-span-full text-center py-12 text-slate-500">Loading BOMs...</div>
              ) : boms.length === 0 ? (
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

      {/* Yield Input Modal */}
      {yieldModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleYieldCancel}></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">Finish & Run Deductions</h3>
              <button onClick={handleYieldCancel} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Enter the actual units produced for <span className="font-semibold text-slate-900">WO-{String(yieldModal.wo?.id).padStart(4,'0')}</span>. Raw material stock will be deducted automatically.</p>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Actual Yield <span className="text-slate-400 font-normal">(leave blank to use target: {yieldModal.wo?.target_quantity.toLocaleString()} units)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder={String(yieldModal.wo?.target_quantity ?? '')}
                  value={yieldInput}
                  onChange={e => { setYieldInput(e.target.value); setModalError(''); }}
                  autoFocus
                />
              </div>
              {modalError && <p className="text-sm text-red-600 font-medium">{modalError}</p>}
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
              <button type="button" onClick={handleYieldCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
              <button type="button" onClick={handleYieldConfirm} className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-green-700 hover:bg-green-800 shadow-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Confirm & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Completion Next Steps Modal */}
      {completionModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Production Complete!</h3>
                  <p className="text-xs text-slate-500 mt-0.5">WO-{String(completionModal.wo?.id).padStart(4,'0')} · {completionModal.bomName}</p>
                </div>
              </div>
              <button onClick={() => setCompletionModal({ open: false })} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6">
              {/* Summary strip */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 rounded-lg border border-slate-200 mb-6">
                <div className="px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Target</p>
                  <p className="text-xl font-extrabold text-slate-900">{completionModal.wo?.target_quantity.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">units</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Actual Yield</p>
                  <p className="text-xl font-extrabold text-green-700">{completionModal.actualYield?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">units</p>
                </div>
                <div className="px-4 py-3 text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Loss</p>
                  <p className={clsx("text-xl font-extrabold", (completionModal.wastage ?? 0) > 0 ? "text-red-600" : "text-slate-900")}>{completionModal.wastage?.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">units</p>
                </div>
              </div>

              {/* Next steps */}
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">What to do next</p>
              <div className="space-y-2">
                <button
                  onClick={() => { setCompletionModal({ open: false }); navigate('/quality'); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Run Quality Assurance</p>
                    <p className="text-xs text-slate-500 mt-0.5">Log QC inspection for this batch before dispatch</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </button>

                <button
                  onClick={() => { setCompletionModal({ open: false }); navigate('/inventory'); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors"><Package className="w-5 h-5 text-green-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Check Finished Goods Inventory</p>
                    <p className="text-xs text-slate-500 mt-0.5">Verify stock was updated and check current levels</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </button>

                <button
                  onClick={() => { setCompletionModal({ open: false }); setIsWbModalOpen(true); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors"><ClipboardList className="w-5 h-5 text-slate-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Start Another Work Order</p>
                    <p className="text-xs text-slate-500 mt-0.5">Queue the next production batch</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </button>

                <button
                  onClick={() => { setCompletionModal({ open: false }); navigate('/reports'); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all group text-left"
                >
                  <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors"><BarChart2 className="w-5 h-5 text-purple-600" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">View Production Reports</p>
                    <p className="text-xs text-slate-500 mt-0.5">Review yield trends and factory analytics</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </button>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 rounded-b-xl border-t border-slate-100 flex justify-end">
              <button onClick={() => setCompletionModal({ open: false })} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">
                Done
              </button>
            </div>
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
                      <button
                        type="button"
                        onClick={() => setBomComponents(bomComponents.filter((_, i) => i !== index))}
                        className={clsx("p-2 rounded", actionButtonStyles.danger)}
                      >
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
