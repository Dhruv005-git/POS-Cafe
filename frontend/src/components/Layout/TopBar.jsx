import { useAuth, getRoleRedirect } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Coffee, User, LayoutDashboard, ChefHat } from 'lucide-react';

const roleColors = {
  admin:    'badge-primary',
  staff:    'badge-success',
  cashier:  'badge-success',
  kitchen:  'badge-warning',
  customer: 'badge-accent',
};

const roleIcons = {
  admin:    '👑',
  staff:    '🧾',
  cashier:  '🧾',
  kitchen:  '👨‍🍳',
  customer: '🙋',
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin gets link to admin dashboard, others to /dashboard
  const dashboardLink = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <header className="bg-dark-800 border-b border-slate-700/50 px-6 py-3 flex items-center justify-between z-10">

      {/* LEFT: Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
          <Coffee className="w-4 h-4 text-primary-400" />
        </div>
        <span className="font-display font-bold text-slate-100 text-lg">POS Cafe</span>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-4">

        {/* Dashboard link — only for admin/staff roles */}
        {user && ['admin', 'staff', 'cashier'].includes(user.role) && (
          <Link
            to={dashboardLink}
            className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            {user.role === 'admin' ? 'Admin Panel' : 'Dashboard'}
          </Link>
        )}

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-500/20 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary-400" />
            </div>
            <span className="text-sm text-slate-300">{user.name}</span>
            <span className={`${roleColors[user.role] || 'badge-primary'} badge text-[10px] flex items-center gap-0.5`}>
              {roleIcons[user.role]} {user.role}
            </span>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-secondary flex items-center gap-2 text-sm py-1.5 px-3"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>

      </div>
    </header>
  );
}