import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { getReportingData, subscribeToDemoStore } from '../demo/store';

export default function Reporting() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const reportData = await getReportingData();
        setData(reportData);
        setError(null);
      } catch (err) {
        console.error('Reporting demo data load failed:', err);
        setError('Reporting demo data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    void loadReportData();

    return subscribeToDemoStore(() => {
      void loadReportData();
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse font-medium">Generating Analytics...</div>;
  }

  const smallestSliceIndex = data?.inventoryByCategory?.length
    ? data.inventoryByCategory.reduce(
        (smallestIndex: number, category: any, index: number, categories: any[]) =>
          category.value < categories[smallestIndex].value ? index : smallestIndex,
        0
      )
    : -1;

  const pieColors = data?.inventoryByCategory?.map((_: any, index: number) =>
    index === smallestSliceIndex ? '#2563eb' : '#020617'
  ) ?? [];

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

      {error && (
        <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {error}
        </div>
      )}

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
                  stroke="#ffffff"
                  strokeWidth={3}
                >
                  {data?.inventoryByCategory.map((entry:any, index:number) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
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
                   <div className="w-3 h-3 rounded-sm" style={{backgroundColor: pieColors[idx]}}></div>
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
