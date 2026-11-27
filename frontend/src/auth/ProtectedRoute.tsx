import { Navigate, Outlet, useLocation } from 'react-router';
import type { Role } from '../api/types';
import { Spinner } from '../components/ui';
import { useAuth } from './AuthContext';

/**
 * Frontend route guard. It only hides screens a role cannot use — the backend
 * still enforces every permission with JWT + RolesGuard on each request.
 */
export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner label="Checking session…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}
