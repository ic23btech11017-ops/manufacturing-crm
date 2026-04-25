import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Factory, Package, Wrench, ShieldCheck, Truck, Network, BarChart3, ShieldAlert, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../auth/AuthContext';
import { canAccess, ROLE_COLORS, type UserRole } from '../auth/roles';

const navigation = [
  { name: 'Dashboard',         href: '/',            icon: LayoutDashboard, allowedRoles: ['admin','manager','production_lead','procurement_officer','warehouse_operator'] },
  { name: 'CRM',               href: '/clients',     icon: Users,           allowedRoles: ['admin','manager'] },
  { name: 'Procurement',       href: '/procurement', icon: Truck,           allowedRoles: ['admin','procurement_officer'] },
  { name: 'Quotations',        href: '/quotations',  icon: FileText,        allowedRoles: ['admin','manager'] },
  { name: 'Sales & Delivery',  href: '/orders',      icon: Package,         allowedRoles: ['admin','manager'] },
  { name: 'Production Control',href: '/production',  icon: Factory,         allowedRoles: ['admin','production_lead'] },
  { name: 'Quality Assurance', href: '/quality',     icon: ShieldCheck,     allowedRoles: ['admin','production_lead'] },
  { name: 'Inventory',         href: '/inventory',   icon: Wrench,          allowedRoles: ['admin','production_lead','procurement_officer','warehouse_operator'] },
  { name: 'Warehouse Routing', href: '/warehouse',   icon: Network,         allowedRoles: ['admin','procurement_officer','warehouse_operator'] },
  { name: 'Reports',           href: '/reports',     icon: BarChart3,       allowedRoles: ['admin','manager'] },
  { name: 'System Admin',      href: '/admin',       icon: ShieldAlert,     allowedRoles: ['admin'] },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  const visibleNav = navigation.filter(item => item.allowedRoles.includes(user.role));
  const currentPage = navigation.find(item =>
    location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
  );

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const avatarColor = ROLE_COLORS[user.role as UserRole] ?? 'bg-slate-200 text-slate-800';

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-screen z-10 shadow-sm relative">
        <div className="p-6 mb-4">
          <h1 className="text-slate-900 font-extrabold text-2xl tracking-tight leading-none mb-1">Kalnet MOS</h1>
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider">Lexa Bio Plast</p>
        </div>
        <nav className="flex-1 flex flex-col overflow-y-auto">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
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
                <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-slate-900" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className={clsx("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-white/20 shadow-sm shrink-0", avatarColor)}>
              {user.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-900 font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium truncate">{user.roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex flex-col flex-1 h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 text-sm font-semibold text-slate-500">
            <span className="text-slate-900 border-b-2 border-slate-900 h-16 flex items-center">
              {currentPage?.name ?? 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full", avatarColor)}>
              {user.roleLabel}
            </span>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto flex flex-col bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
