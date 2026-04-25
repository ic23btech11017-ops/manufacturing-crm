import type { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { UserRole } from './roles';

type Props = {
  children: ReactNode;
  allowedRoles: UserRole[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-24 text-center">
        <div className="p-4 bg-slate-100 rounded-full mb-5">
          <Lock className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 mb-1 max-w-sm">
          Your role <span className="font-semibold text-slate-700">({user.roleLabel})</span> does not have permission to view this page.
        </p>
        <p className="text-sm text-slate-400 mb-6">Contact your System Admin to request access.</p>
        <Link to="/" className="px-5 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
