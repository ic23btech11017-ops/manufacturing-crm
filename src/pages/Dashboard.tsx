import { useEffect, useState } from 'react';
import { TrendingUp, Package, Clock, Users, FileText, Factory, Activity } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { getDashboardMetrics, subscribeToDemoStore } from '../demo/store';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    inProduction: 0,
    delayedOrders: 0,
    totalClients: 0,
    basicRevenue: 0,
    activityData: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      const data = await getDashboardMetrics();
      setMetrics(data);
      setLoading(false);
    };

    void loadMetrics();

    return subscribeToDemoStore(() => {
      void loadMetrics();
    });
  }, []);

  const stats = [
    { name: 'Total Orders', value: metrics.totalOrders, icon: Package, link: '/orders' },
    { name: 'In Production', value: metrics.inProduction, icon: TrendingUp, link: '/production' },
    { name: 'Pipeline Revenue', value: `$${metrics.basicRevenue.toLocaleString()}`, icon: FileText, link: '/quotations' },
    { name: 'Total Clients', value: metrics.totalClients, icon: Users, link: '/clients' },
  ];

  if (loading) {
    return <div className="text-gray-500 animate-pulse p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 shrink-0">
        {stats.map((stat, i) => (
          <Link key={stat.name} to={stat.link} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center hover:shadow-md hover:border-slate-300 transition-all group">
            <p className="text-xs text-slate-500 font-bold uppercase mb-2 flex items-center gap-2 group-hover:text-slate-700 transition-colors">
              <stat.icon className="h-4 w-4" aria-hidden="true" />
              {stat.name}
            </p>
            <p className={clsx("text-3xl font-extrabold text-slate-900")}>
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            Activity Overview
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#666666" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#666666" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#666666', fontSize: 12}} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="sales" stroke="#000000" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="production" stroke="#666666" strokeWidth={2} fillOpacity={1} fill="url(#colorProd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-slate-200 p-6 flex flex-col">
          <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-slate-400" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <Link to="/clients" className="block text-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex flex-col items-center justify-center h-full">
              <Users className="h-6 w-6 text-slate-800 mx-auto mb-2" />
              <span className="font-semibold text-slate-700 text-sm">Add Client</span>
            </Link>
            <Link to="/quotations" className="block text-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex flex-col items-center justify-center h-full">
              <FileText className="h-6 w-6 text-slate-800 mx-auto mb-2" />
              <span className="font-semibold text-slate-700 text-sm">Create Quote</span>
            </Link>
            <Link to="/orders" className="block text-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex flex-col items-center justify-center h-full">
              <Factory className="h-6 w-6 text-slate-800 mx-auto mb-2" />
              <span className="font-semibold text-slate-700 text-sm">Production</span>
            </Link>
            <Link to="/orders?tab=live" className="block text-center p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group flex flex-col items-center justify-center h-full">
              <div className="relative mx-auto mb-2 w-max">
                <Activity className="h-6 w-6 text-slate-800 group-hover:scale-110 transition-transform" />
                <div className="absolute top-0 right-0 w-2 h-2 bg-slate-500 rounded-full animate-ping"></div>
              </div>
              <span className="font-semibold text-slate-700 text-sm">Telemetry</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
