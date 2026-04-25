import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { DEMO_CREDENTIALS } from '../auth/roles';

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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Kalnet MOS</h1>
          <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mt-1">Lexa Bio Plast · Manufacturing OS</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">Enter your credentials to access your workspace.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                autoComplete="username"
                className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                className="block w-full rounded-lg border border-slate-300 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Demo Credentials — click to fill</p>
          <div className="space-y-1.5">
            {Object.entries(DEMO_CREDENTIALS).map(([uname, cred]) => (
              <button
                key={uname}
                type="button"
                onClick={() => fillCredentials(uname, cred.password)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 border border-slate-100 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {cred.user.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cred.user.name}</p>
                    <p className="text-xs text-slate-500">{cred.user.roleLabel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono text-slate-500">{uname}</p>
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
