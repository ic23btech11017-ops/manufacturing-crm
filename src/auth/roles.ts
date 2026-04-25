export type UserRole =
  | 'admin'
  | 'manager'
  | 'production_lead'
  | 'procurement_officer'
  | 'warehouse_operator';

export type AuthUser = {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  initials: string;
  loggedInAt: string;
};

export const ROLE_PAGES: Record<UserRole, string[]> = {
  admin:               ['/', '/clients', '/quotations', '/orders', '/production', '/quality', '/inventory', '/procurement', '/warehouse', '/reports', '/admin'],
  manager:             ['/', '/clients', '/quotations', '/orders', '/reports'],
  production_lead:     ['/', '/production', '/quality', '/inventory'],
  procurement_officer: ['/', '/procurement', '/inventory', '/warehouse'],
  warehouse_operator:  ['/', '/inventory', '/warehouse'],
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin:               'bg-slate-900 text-white',
  manager:             'bg-blue-700 text-white',
  production_lead:     'bg-amber-700 text-white',
  procurement_officer: 'bg-green-700 text-white',
  warehouse_operator:  'bg-purple-700 text-white',
};

type DemoCredential = { password: string; user: Omit<AuthUser, 'loggedInAt'> };

export const DEMO_CREDENTIALS: Record<string, DemoCredential> = {
  admin: {
    password: 'admin123',
    user: { id: 'user-admin', username: 'admin', name: 'Alex Morgan', role: 'admin', roleLabel: 'System Admin', initials: 'AM' },
  },
  manager: {
    password: 'manager123',
    user: { id: 'user-manager', username: 'manager', name: 'Maya Patel', role: 'manager', roleLabel: 'Operations Manager', initials: 'MP' },
  },
  production: {
    password: 'prod123',
    user: { id: 'user-production', username: 'production', name: 'Raj Sharma', role: 'production_lead', roleLabel: 'Production Lead', initials: 'RS' },
  },
  procurement: {
    password: 'proc123',
    user: { id: 'user-procurement', username: 'procurement', name: 'Sara Ahmed', role: 'procurement_officer', roleLabel: 'Procurement Officer', initials: 'SA' },
  },
  warehouse: {
    password: 'ware123',
    user: { id: 'user-warehouse', username: 'warehouse', name: 'Dev Nair', role: 'warehouse_operator', roleLabel: 'Warehouse Operator', initials: 'DN' },
  },
};

export const ALL_DEMO_USERS: Omit<AuthUser, 'loggedInAt'>[] = Object.values(DEMO_CREDENTIALS).map(c => c.user);

export function canAccess(role: UserRole, pathname: string): boolean {
  return ROLE_PAGES[role].some(p => pathname === p || pathname.startsWith(p + '/'));
}
