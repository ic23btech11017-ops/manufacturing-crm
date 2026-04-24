import React, { useState, useEffect } from 'react';
import { Plus, Check, X, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

type Client = {
  id: number;
  name: string;
  company: string;
};

type Quotation = {
  id: number;
  client_id: number;
  items: Array<{ description: string, quantity: number, unit_price: number }>;
  total_amount: number;
  status: string;
  created_at: string;
  client_company: string;
  client_name: string;
  // Fallbacks for older data structures
  product_type?: string;
  size?: string;
  quantity?: number;
  price?: number;
};

export default function Quotations() {
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    client_id: '',
    items: [{ description: '', quantity: '', unit_price: '' }],
    status: 'pending',
    total_amount: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/quotations'),
        fetch('/api/clients')
      ]);
      const qs = await qRes.json();
      const cs = await cRes.json();
      setQuotes(Array.isArray(qs) ? qs : []);
      setClients(Array.isArray(cs) ? cs : []);
    } catch (e) {
      console.error(e);
      setQuotes([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: parseInt(formData.client_id, 10),
          items: formData.items,
          total_amount: parseFloat(formData.total_amount) || 0,
          status: 'pending'
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ client_id: '', items: [{ description: '', quantity: '', unit_price: '' }], status: 'pending', total_amount: '' });
        fetchData();
      } else {
        throw new Error('Save failed');
      }
    } catch(e: any) {
      alert("Error saving: " + e.message);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/quotations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchData();
    } catch(e) {
      console.error(e);
    }
  };

  const convertToOrder = async (id: number) => {
    try {
      await fetch(`/api/orders/convert/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
      });
      fetchData();
    } catch(e) {
      console.error(e);
      alert('Conversion failed');
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-slate-100 text-slate-800',
    approved: 'bg-slate-100 border border-slate-200 text-slate-800',
    rejected: 'bg-slate-100 border border-slate-200 text-slate-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Quotations</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Quote
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-10 text-gray-500 animate-pulse">Loading quotations...</div>
        ) : quotes.length === 0 ? (
          <div className="col-span-full text-center py-10 text-gray-500">No quotations found. Create one.</div>
        ) : (
          quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{quote.client_company}</h3>
                    <p className="text-xs text-gray-500">{quote.client_name}</p>
                  </div>
                  <span className={clsx("px-2.5 py-1 rounded-full text-xs font-semibold", statusColors[quote.status] || 'bg-gray-100 text-gray-800')}>
                    {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {quote.items && quote.items.map((item, idx) => (
                    <div key={idx} className="border-b border-gray-100 pb-2 mb-2 last:border-0">
                      <div className="text-sm font-semibold text-slate-800">{item.description}</div>
                      <div className="text-sm text-slate-500">Qty: {item.quantity} units @ ${item.unit_price}/ea</div>
                    </div>
                  ))}
                  {!quote.items && quote.product_type && (
                    <div className="border-b border-gray-100 pb-2 mb-2 last:border-0">
                      <div className="text-sm font-semibold text-slate-800">{quote.product_type} - {quote.size}</div>
                      <div className="text-sm text-slate-500">Qty: {quote.quantity} units</div>
                    </div>
                  )}
                  <div className="text-sm font-bold text-gray-900 mt-3 pt-2 border-t block">
                    Total Value: ${(quote.total_amount ?? quote.price ?? 0).toFixed(2)}
                  </div>
                </div>
                
                <div className="text-xs text-gray-400">Created: {format(new Date(quote.created_at), 'MMM d, yyyy')}</div>
              </div>
              
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex gap-2 overflow-x-auto">
                {quote.status === 'pending' && (
                  <button onClick={() => updateStatus(quote.id, 'sent')} className="text-xs font-medium text-slate-900 hover:text-slate-800 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md flex-1 text-center">
                    Mark Sent
                  </button>
                )}
                {quote.status === 'sent' && (
                  <>
                    <button onClick={() => convertToOrder(quote.id)} className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-md flex-1 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Approve & Order
                    </button>
                    <button onClick={() => updateStatus(quote.id, 'rejected')} className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-md flex items-center justify-center gap-1">
                      <X className="w-3 h-3" />
                    </button>
                  </>
                )}
                {quote.status === 'approved' && (
                  <div className="text-xs text-slate-700 font-medium flex items-center gap-1 w-full justify-center py-1.5">
                    <Check className="w-4 h-4" /> Converted to Order
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative z-10 bg-white rounded-xl shadow-2xl transform transition-all w-full max-w-lg mx-4">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Create New Quotation</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Client <span className="text-slate-900">*</span></label>
                  <select required className="block w-full rounded-md border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm bg-white" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                    <option value="" disabled>Select Client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Item Description <span className="text-slate-900">*</span></label>
                  <input required type="text" placeholder="e.g. 500ml PET Bottles" className="block w-full rounded-md border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm" value={formData.items[0].description} onChange={e => {
                    const newItems = [...formData.items];
                    newItems[0].description = e.target.value;
                    setFormData({...formData, items: newItems})
                  }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity <span className="text-slate-900">*</span></label>
                    <input required type="number" min="1" className="block w-full rounded-md border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm" value={formData.items[0].quantity} onChange={e => {
                      const newItems = [...formData.items];
                      newItems[0].quantity = e.target.value;
                      setFormData({...formData, items: newItems})
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Price ($) <span className="text-slate-900">*</span></label>
                    <input required type="number" step="0.01" className="block w-full rounded-md border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm" value={formData.items[0].unit_price} onChange={e => {
                      const newItems = [...formData.items];
                      newItems[0].unit_price = e.target.value;
                      setFormData({...formData, items: newItems})
                    }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Total Quote Amount ($) <span className="text-slate-900">*</span></label>
                  <input required type="number" step="0.01" className="block w-full rounded-md border border-gray-300 py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-slate-900 sm:text-sm" value={formData.total_amount} onChange={e => setFormData({...formData, total_amount: e.target.value})} />
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none transition-colors border border-gray-300 bg-white">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none transition-colors shadow-sm">
                  Create Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
