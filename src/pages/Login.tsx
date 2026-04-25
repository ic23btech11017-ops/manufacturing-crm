import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Factory, ShieldCheck, BarChart2, Package, Truck, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { DEMO_CREDENTIALS, ROLE_COLORS, type UserRole } from '../auth/roles';

const features = [
  { icon: Factory,    label: 'Production Control',  desc: 'BOMs, work orders & batch tracing' },
  { icon: ShieldCheck,label: 'Quality Assurance',   desc: 'Inspection logs & pass/fail tracking' },
  { icon: Package,    label: 'Inventory Management',desc: 'Real-time stock with reorder alerts' },
  { icon: Truck,      label: 'Procurement',          desc: 'Suppliers, POs & goods receiving' },
  { icon: BarChart2,  label: 'Reporting & Analytics',desc: 'Factory KPIs and trend charts' },
  { icon: Users,      label: 'Role-Based Access',    desc: '5 roles with scoped permissions' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname ?? '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = login(username.trim(), password);
    setLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  const fillCredentials = (uname: string, pwd: string) => {
    setUsername(uname);
    setPassword(pwd);
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
          backgroundSize: '40px 40px'
        }} />

        {/* Brand */}
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Kalnet MOS</h1>
          <p className="text-sm text-slate-400 font-semibold uppercase tracking-widest mt-1">Lexa Bio Plast · Manufacturing OS</p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Platform Capabilities</p>
          {features.map(f => (
            <div key={f.label} className="flex items-start gap-4">
              <div className="p-2 bg-white/10 rounded-lg shrink-0">
                <f.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer tagline */}
        <p className="relative z-10 text-xs text-slate-600">
          © 2026 Kalnet MOS · End-to-end manufacturing operations platform
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full lg:w-1/2 bg-slate-50 flex flex-col justify-center px-6 sm:px-12 xl:px-20 py-12 overflow-y-auto">
        {/* Mobile brand (hidden on desktop) */}
        <div className="lg:hidden mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kalnet MOS</h1>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">Lexa Bio Plast · Manufacturing OS</p>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Sign-in form */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Sign in</h2>
            <p className="text-sm text-slate-500">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. admin"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>

            {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Demo accounts</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Demo credentials */}
          <div className="space-y-2">
            {Object.entries(DEMO_CREDENTIALS).map(([uname, cred]) => (
              <button
                key={uname}
                type="button"
                onClick={() => fillCredentials(uname, cred.password)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${ROLE_COLORS[cred.user.role as UserRole]}`}>
                    {cred.user.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 leading-none mb-0.5">{cred.user.name}</p>
                    <p className="text-xs text-slate-500">{cred.user.roleLabel}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-mono text-slate-600">{uname}</p>
                  <p className="text-xs font-mono text-slate-400">{cred.password}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
