import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { getOrders, subscribeToDemoStore } from '../demo/store';

type Order = {
  id: number;
  client_company: string;
  product_details: string;
  quantity: number;
  status: string;
  deadline: string | null;
};

// Simulated factory machines structure
type Machine = {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'idle' | 'warning' | 'offline';
  current_order_id: number | null;
  efficiency: number;
  output_count: number;
};

export default function LiveMonitoring() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [machines, setMachines] = useState<Machine[]>([
    { id: 'M-01', name: 'Extruder Alpha', type: 'Extrusion', status: 'running', current_order_id: null, efficiency: 94, output_count: 12500 },
    { id: 'M-02', name: 'Extruder Beta', type: 'Extrusion', status: 'idle', current_order_id: null, efficiency: 0, output_count: 0 },
    { id: 'M-03', name: 'Printer 01', type: 'Printing', status: 'running', current_order_id: null, efficiency: 88, output_count: 8400 },
    { id: 'M-04', name: 'Cutter Line A', type: 'Cutting/Sealing', status: 'warning', current_order_id: null, efficiency: 65, output_count: 4200 },
    { id: 'M-05', name: 'Cutter Line B', type: 'Cutting/Sealing', status: 'running', current_order_id: null, efficiency: 98, output_count: 15000 },
    { id: 'M-06', name: 'Recycling Unit', type: 'Processing', status: 'offline', current_order_id: null, efficiency: 0, output_count: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchOrders();
    const unsubscribe = subscribeToDemoStore(() => {
      void fetchOrders();
    });

    // Simulate live machine updates
    const interval = setInterval(() => {
      setMachines(prev => prev.map(m => {
        if (m.status === 'running') {
          return {
            ...m,
            output_count: m.output_count + Math.floor(Math.random() * 50),
            efficiency: Math.max(70, Math.min(100, m.efficiency + (Math.random() * 4 - 2)))
          };
        }
        return m;
      }));
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const arr = await getOrders();
      setOrders(arr);

      const productionOrders = arr.filter((order) => order.status === 'in_production' || order.status === 'ready');

      setMachines(prev => prev.map((m, index) => {
        if (m.status === 'running' || m.status === 'warning') {
          return {
            ...m,
            current_order_id: productionOrders[index % productionOrders.length]?.id || null
          };
        }
        return m;
      }));
    } catch (e) {
      console.error('Failed to load orders for monitoring', e);
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    running: 'bg-slate-100 border border-slate-200 text-slate-800 border-green-200',
    warning: 'bg-slate-100 border border-slate-200 text-slate-800 border-amber-200',
    idle: 'bg-gray-100 text-gray-800 border-gray-200',
    offline: 'bg-slate-100 border border-slate-200 text-slate-800 border-red-200'
  };

  const activeCount = machines.filter(m => m.status === 'running').length;
  const warningCount = machines.filter(m => m.status === 'warning').length;
  const overallEfficiency = activeCount > 0 
    ? Math.round(machines.filter(m => m.status === 'running').reduce((acc, m) => acc + m.efficiency, 0) / activeCount) 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-slate-500 font-medium">Real-time floor monitoring and machine telemetry</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-semibold text-slate-700">Live Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-500 mb-1">Active Machines</div>
          <div className="text-3xl font-extrabold text-slate-900">{activeCount} / {machines.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-500 mb-1">Floor Warning</div>
          <div className="text-3xl font-extrabold text-amber-600">{warningCount} Event{warningCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-500 mb-1">Avg Efficiency</div>
          <div className="text-3xl font-extrabold text-slate-900">{overallEfficiency}%</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="text-sm font-semibold text-slate-500 mb-1">Total Output (Shift)</div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {machines.reduce((acc, m) => acc + m.output_count, 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Machine Status</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {machines.map((machine) => {
            const activeOrder = orders.find(o => o.id === machine.current_order_id);
            // Compact row, no icons
            return (
              <div key={machine.id} className="p-3 flex flex-col md:flex-row items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className="min-w-[140px]">
                  <h4 className="font-bold text-slate-900 text-sm">{machine.name}</h4>
                  <span className="text-xs font-semibold text-slate-500">{machine.type}</span>
                </div>

                <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-2 items-center text-xs">
                  <div>
                    <span className={clsx("px-2.5 py-1 text-xs font-semibold rounded-full border", statusColors[machine.status])}>
                      {machine.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">Efficiency</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={clsx("h-full rounded-full transition-all duration-500", 
                            machine.efficiency > 85 ? 'bg-green-500' : 
                            machine.efficiency > 60 ? 'bg-amber-500' : 'bg-red-500'
                          )} 
                          style={{ width: `${machine.efficiency}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-700 w-10">{machine.efficiency.toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">Output Count</div>
                    <div className="text-sm font-bold text-slate-900">{machine.output_count.toLocaleString()}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-1">Active Job</div>
                    {activeOrder ? (
                      <div>
                        <div className="text-sm font-bold text-slate-900 truncate" title={activeOrder.product_details}>Ord #{activeOrder.id} - {activeOrder.product_details}</div>
                        <div className="text-xs text-slate-500 truncate" title={activeOrder.client_company}>{activeOrder.client_company}</div>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-slate-400">No active job</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
