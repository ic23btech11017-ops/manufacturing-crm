import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Download } from 'lucide-react';
import clsx from 'clsx';
// A complete system should probably have a charting library like Recharts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export default function Reporting() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // We can simulate an aggregated reports endpoint, or fetch from existing ones
    // For a demo-ready dashboard, we will aggregate a few stats.
    Promise.all([
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
      fetch('/api/quality').then(r => r.json())
    ]).then(([orders, inventory, quality]) => {
      
      const ordersByMonth = orders.reduce((acc: any, order: any) => {
        const month = new Date(order.created_at).toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { name: month, orders: 0 };
        acc[month].orders += 1;
        return acc;
      }, {});

      const inventoryValuation = inventory.reduce((sum: number, item: any) => sum + (item.quantity * item.cost), 0);
      const inventoryByCategory = [
        { name: 'Raw Materials', value: inventory.filter((i:any) => i.category === 'raw').reduce((sum:number, i:any) => sum + (i.quantity * i.cost), 0) },
        { name: 'Finished Goods', value: inventory.filter((i:any) => i.category === 'finished').reduce((sum:number, i:any) => sum + (i.quantity * i.cost), 0) }
      ];

      const passRate = quality.filter((q:any) => q.status === 'passed').length / Math.max(quality.filter((q:any) => q.status !== 'pending').length, 1) * 100;

      setData({
        orderTrends: Object.values(ordersByMonth),
        inventoryValuation,
        inventoryByCategory,
        qualityPassRate: passRate,
        totalOrders: orders.length
      });
      setLoading(false);
    });

  }, []);

  const COLORS = ['#000000', '#333333', '#666666', '#cccccc'];

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Generating Analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Reporting & Analytics</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">High-level factory metrics and trends</p>
        </div>
        <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-600"/> Total Orders</p>
          <p className="text-3xl font-extrabold text-slate-900">{data?.totalOrders}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2"><PieChart className="w-4 h-4 text-slate-600"/> Inventory Value</p>
          <p className="text-3xl font-extrabold text-slate-900">${data?.inventoryValuation?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-600"/> Quality Pass Rate</p>
          <p className="text-3xl font-extrabold text-slate-900">{data?.qualityPassRate?.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <p className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2 relative z-10"><BarChart3 className="w-4 h-4 text-slate-500"/> Factory PUE</p>
          <p className="text-3xl font-extrabold text-slate-900 relative z-10">1.24 <span className="text-sm font-normal text-slate-500 ml-1">Avg</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-slate-400" /> Order Volume Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.orderTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="orders" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-slate-400" /> Inventory by Category</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data?.inventoryByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data?.inventoryByCategory.map((entry:any, index:number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => `$${value.toLocaleString()}`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {data?.inventoryByCategory.map((category:any, idx:number) => (
               <div key={idx} className="flex justify-between items-center text-sm">
                 <div className="flex items-center gap-2 font-medium text-slate-600">
                   <div className="w-3 h-3 rounded-sm" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                   {category.name}
                 </div>
                 <div className="font-bold text-slate-900">${category.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
