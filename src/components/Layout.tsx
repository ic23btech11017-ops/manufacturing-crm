import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Factory, Package, Wrench, ShieldCheck, Truck, Network, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'CRM', href: '/clients', icon: Users },
    { name: 'Procurement', href: '/procurement', icon: Truck },
    { name: 'Quotations', href: '/quotations', icon: FileText },
    { name: 'Sales & Delivery', href: '/orders', icon: Package },
    { name: 'Production Control', href: '/production', icon: Factory },
    { name: 'Quality Assurance', href: '/quality', icon: ShieldCheck },
    { name: 'Inventory', href: '/inventory', icon: Wrench },
    { name: 'Warehouse Routing', href: '/warehouse', icon: Network },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-screen z-10 shadow-sm relative">
        <div className="p-6 mb-4">
          <h1 className="text-slate-900 font-extrabold text-2xl tracking-tight leading-none mb-1">Kalnet MOS</h1>
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Lexa Bio Plast</p>
        </div>
        <nav className="flex-1 flex flex-col">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href) && (item.href !== '/' || location.pathname === '/');
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'px-6 py-3.5 flex items-center gap-3 text-sm cursor-pointer transition-all duration-200 border-l-4',
                  isActive
                    ? 'bg-slate-100 border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-800 text-sm font-bold border border-slate-300 shadow-sm">
              AM
            </div>
            <div>
              <p className="text-sm text-slate-900 font-semibold">Admin Manager</p>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-medium">System Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col flex-1 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
            <span className="text-slate-900 border-b-2 border-slate-900 h-16 flex items-center">Active Overview</span>
          </div>
          <div className="flex items-center gap-3">
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto flex flex-col bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
