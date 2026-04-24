import React, { useState, useEffect } from 'react';
import { Network, ArrowRightLeft, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

type Warehouse = {
  id: number;
  name: string;
  location: string;
  manager: string;
};

type StockTransfer = {
  id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  item_sku: string;
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  requested_at: string;
};

export default function Warehouse() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dummy data implementation for now to build visual structure
  useEffect(() => {
    fetch('/api/warehouses')
      .then(r => r.json())
      .then(data => {
        setWarehouses(data);
        if (data && data.length > 0) {
          setTransfers([
            { id: 1, from_warehouse_id: 1, to_warehouse_id: 2, item_sku: 'R-PB-1', quantity: 500, status: 'completed', requested_at: new Date(Date.now() - 86400000 * 2).toISOString() },
            { id: 2, from_warehouse_id: 2, to_warehouse_id: 1, item_sku: 'F-PB-1', quantity: 120, status: 'pending', requested_at: new Date().toISOString() }
          ]);
        } else {
          setTransfers([]);
        }
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Warehouse Routing</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage locations and stock transfers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-500"/> Facilities</h3>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {warehouses.length === 0 ? <p className="p-4 text-center text-slate-500 font-medium">No warehouses registered</p> : warehouses.map(w => (
              <div key={w.id} className="p-4 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{w.name}</h4>
                    <p className="text-xs text-slate-500">{w.location}</p>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded text-xs font-semibold text-slate-600">
                    ID: {w.id}
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-600 font-medium">
                  Manager: <span className="text-slate-900">{w.manager}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-slate-500"/> Stock Routing Log</h3>
          </div>
          <div className="divide-y divide-slate-200 p-2 overflow-y-auto max-h-[500px]">
             {transfers.length === 0 ? <p className="p-4 text-center text-slate-500 font-medium">No active stock transfers</p> : transfers.map(t => {
               const fromW = warehouses.find(w => w.id === t.from_warehouse_id);
               const toW = warehouses.find(w => w.id === t.to_warehouse_id);
               return (
                 <div key={t.id} className="p-4 flex flex-col gap-3">
                   <div className="flex justify-between items-center">
                     <span className="font-mono text-xs font-bold text-slate-500">TRN-{t.id.toString().padStart(4, '0')}</span>
                     <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        t.status === 'completed' ? "bg-slate-100 border border-slate-200 text-slate-700" :
                        t.status === 'pending' ? "bg-slate-100 border border-slate-200 text-slate-700" :
                        "bg-slate-100 text-slate-700"
                     )}>{t.status}</span>
                   </div>
                   
                   <div className="flex items-center gap-3 text-sm">
                     <div className="flex-1 bg-slate-50 rounded px-3 py-2 border border-slate-200">
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">From</p>
                       <p className="font-semibold text-slate-800 line-clamp-1">{fromW?.name}</p>
                     </div>
                     <ArrowRightLeft className="w-5 h-5 text-slate-300 shrink-0" />
                     <div className="flex-1 bg-slate-50 rounded px-3 py-2 border border-slate-200">
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">To</p>
                       <p className="font-semibold text-slate-800 line-clamp-1">{toW?.name}</p>
                     </div>
                   </div>

                   <div className="flex justify-between items-end mt-1">
                     <div>
                       <p className="text-[11px] font-bold text-slate-500 uppercase">Item Transferred</p>
                       <p className="text-sm font-semibold text-slate-900 mt-0.5">{t.quantity}x <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{t.item_sku}</span></p>
                     </div>
                     <span className="text-xs text-slate-400 font-medium">{format(new Date(t.requested_at), 'MMM d, h:mm a')}</span>
                   </div>
                 </div>
               )
             })}
          </div>
        </div>
      </div>
    </div>
  );
}
