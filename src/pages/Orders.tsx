import React, { useState, useEffect } from 'react';
import { format, isPast, parseISO } from 'date-fns';
import clsx from 'clsx';
import { AlertCircle, KanbanSquare, Activity } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import LiveMonitoring from './LiveMonitoring';

type Order = {
  id: number;
  quotation_id: number;
  client_id: number;
  product_details: string;
  quantity: number;
  deadline: string | null;
  status: string;
  created_at: string;
  client_company: string;
  client_name: string;
};

const STATUS_STAGES = ['pending', 'in_production', 'ready', 'dispatched', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', 
  in_production: 'In Production', 
  ready: 'Ready', 
  dispatched: 'Dispatched', 
  delivered: 'Delivered'
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<{ id: number, company: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    product_details: '',
    quantity: '',
    deadline: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Orders fetch error:", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Clients fetch error:", e);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchOrders();
    } catch (e) {
      console.error("Order status update:", e);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ client_id: '', product_details: '', quantity: '', deadline: '' });
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isDelayed = (deadline: string | null, status: string) => {
    if (!deadline || status === 'delivered') return false;
    return isPast(parseISO(deadline));
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData('orderId');
    if (orderId) {
      await updateStatus(parseInt(orderId, 10), newStatus);
    }
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'kanban';

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center shrink-0 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Operations</h2>
          <button onClick={() => setIsModalOpen(true)} className="ml-4 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors">
            + Create Order
          </button>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setSearchParams({ tab: 'kanban' })}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors", currentTab === 'kanban' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <KanbanSquare className="w-4 h-4" /> Board
          </button>
          <button
            onClick={() => setSearchParams({ tab: 'live' })}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors", currentTab === 'live' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900")}
          >
            <Activity className="w-4 h-4" /> Live Telemetry
          </button>
        </div>
      </div>

      {currentTab === 'live' ? (
        <LiveMonitoring />
      ) : (
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
        {loading ? (
          <div className="text-center w-full py-10 text-gray-500 animate-pulse">Loading production data...</div>
        ) : (
          STATUS_STAGES.map(stage => {
            const stageOrders = orders.filter(o => o.status === stage);
            return (
              <div 
                key={stage} 
                className="w-[300px] shrink-0 bg-slate-200 flex flex-col rounded-lg p-3 gap-3 h-[calc(100vh-180px)] transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, stage)}
              >
                <div className="flex justify-between items-center mb-1 shrink-0">
                  <h3 className="text-xs font-bold uppercase text-slate-600">
                    {STATUS_LABELS[stage]}
                    <span className="ml-1 text-slate-500 font-normal">({stageOrders.length})</span>
                  </h3>
                  <span className={clsx(
                    "text-lg leading-none",
                    stage === 'ready' ? "text-slate-600" :
                    stage === 'in_production' ? "text-slate-600" :
                    "text-slate-400"
                  )}>
                    {stage === 'pending' ? '...' : stage === 'dispatched' ? '' : '●'}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 pb-2 pr-1">
                  {stageOrders.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium border-2 border-dashed border-slate-300 rounded-lg">
                      Drop orders here
                    </div>
                  ) : stageOrders.map(order => {
                    const delayed = isDelayed(order.deadline, order.status);
                    return (
                      <div 
                        key={order.id} 
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('orderId', order.id.toString());
                          e.currentTarget.style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        className={clsx(
                        "bg-white p-3 rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-l-4 text-[13px] flex flex-col cursor-grab active:cursor-grabbing",
                        stage === 'ready' ? "border-l-green-500" :
                        stage === 'in_production' ? "border-l-amber-500" : // using medium high border
                        delayed ? "border-l-red-500" : "border-l-slate-300",
                        stage === 'dispatched' ? "opacity-60 border-l-blue-400" : ""
                      )}>
                        <p className="font-bold mb-1">ORD-{order.id}: {order.product_details.split(' - ')[0]}</p>
                        <p className="text-xs text-slate-500 mb-2 truncate">Client: {order.client_company}</p>
                        
                        <div className="flex justify-between items-center mt-auto">
                          {order.deadline && stage !== 'dispatched' && stage !== 'delivered' && (
                            <span className={clsx("px-2 py-0.5 rounded-full text-[11px] font-bold uppercase", 
                              delayed ? "bg-slate-100 border border-slate-200 text-slate-700" :
                              stage === 'in_production' ? "bg-slate-100 border border-slate-200 text-slate-700" :
                              stage === 'ready' ? "bg-slate-100 border border-slate-200 text-slate-700" :
                              "bg-slate-100 text-slate-600"
                            )}>
                              {delayed ? 'URGENT' : stage === 'pending' ? 'WAITING' : stage === 'in_production' ? 'PRINTING' : 'QC PASSED'}
                            </span>
                          )}
                          <select 
                            className="text-[10px] bg-transparent text-slate-400 font-bold outline-none cursor-pointer w-20 text-right appearance-none"
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                          >
                            {STATUS_STAGES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative z-10 bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-lg mx-4">
            <form onSubmit={handleCreateOrder}>
              <div className="px-6 py-5 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Create Direct Order</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Client <span className="text-slate-900">*</span></label>
                  <select required className="block w-full rounded-md border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                    <option value="" disabled>Select Client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Product Details <span className="text-slate-900">*</span></label>
                  <input required type="text" placeholder="e.g. Polybag 10x12, Red" className="block w-full rounded-md border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm" value={formData.product_details} onChange={e => setFormData({...formData, product_details: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity <span className="text-slate-900">*</span></label>
                    <input required type="number" min="1" className="block w-full rounded-md border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Deadline Date (optional)</label>
                    <input type="date" className="block w-full rounded-md border border-slate-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none transition-colors border border-slate-300 bg-white">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-colors shadow-sm">
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
