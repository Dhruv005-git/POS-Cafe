import { Navigate } from 'react-router-dom';
import { useAuth, getRoleRedirect } from '../context/AuthContext.jsx';

// allowedRoles: array of permitted roles. If empty/undefined → any authenticated user allowed.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Role check
  if (allowedRoles && allowedRoles.length > 0) {
    const effectiveRole = user.role === 'cashier' ? 'staff' : user.role;
    const allowed = allowedRoles.some(r => r === effectiveRole || r === user.role);
    if (!allowed) {
      // Redirect to their own home page
      return <Navigate to={getRoleRedirect(user.role)} replace />;
    }
  }

  return children;
}