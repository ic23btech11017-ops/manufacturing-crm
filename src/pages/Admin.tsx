import { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, Package, Users, Clock, Activity, AlertTriangle, BarChart2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  getActivityLog,
  getDashboardMetrics,
  getReportingData,
  subscribeToDemoStore,
  type ActivityLogEntry
} from '../demo/store';
import { ALL_DEMO_USERS, ROLE_COLORS, type UserRole } from '../auth/roles';

function roleColor(role: string) {
  return ROLE_COLORS[role as UserRole] ?? 'bg-slate-400 text-white';
}

function relativeTime(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '—';
  }
}

export default function Admin() {
  const [metrics, setMetrics] = useState<any>(null);
  const [reporting, setReporting] = useState<any>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);

  const loadData = async () => {
    const [m, r, log] = await Promise.all([getDashboardMetrics(), getReportingData(), getActivityLog()]);
    setMetrics(m);
    setReporting(r);
    setActivityLog(log);
  };

  useEffect(() => {
    void loadData();
    return subscribeToDemoStore(() => void loadData());
  }, []);

  // Last activity per role
  const lastActiveByRole = (role: string) => {
    const entry = activityLog.find(e => e.role === role);
    return entry ? relativeTime(entry.timestamp) : 'No activity yet';
  };

  const kpis = metrics && reporting ? [
    { label: 'Total Orders', value: metrics.totalOrders, icon: Package, color: 'text-slate-900' },
    { label: 'In Production', value: metrics.inProduction, icon: TrendingUp, color: 'text-blue-700' },
    { label: 'Delayed Orders', value: metrics.delayedOrders, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Total Clients', value: metrics.totalClients, icon: Users, color: 'text-green-700' },
    { label: 'Inventory Value', value: `₹${reporting.inventoryValuation?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, icon: BarChart2, color: 'text-purple-700' },
    { label: 'QC Pass Rate', value: `${reporting.qualityPassRate?.toFixed(1)}%`, icon: ShieldCheck, color: 'text-amber-700' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">System Administration</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Live monitoring — Admin access only</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
          Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Users */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" /> Active Users
          </h3>
          <div className="space-y-3">
            {ALL_DEMO_USERS.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${roleColor(u.role)}`}>
                  {u.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs text-slate-500 truncate">{u.roleLabel}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">{lastActiveByRole(u.role)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col" style={{ maxHeight: '420px' }}>
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" /> Live Activity Feed
            </h3>
            <span className="text-xs text-slate-400">{activityLog.length} events</span>
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-slate-50">
            {activityLog.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-slate-400">
                No activity yet. Perform any action in the system to see it here.
              </div>
            ) : (
              activityLog.map(entry => (
                <div key={entry.id} className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${roleColor(entry.role)}`}>
                    {entry.actor.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{entry.action}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {entry.actor} · <span className="font-mono">{entry.entity}</span>
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{relativeTime(entry.timestamp)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
