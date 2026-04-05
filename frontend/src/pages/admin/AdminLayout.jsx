import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, GitBranch, ShoppingBag, Package,
  Tag, LayoutGrid, Settings, LogOut, Coffee, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/branches', label: 'Branches', icon: GitBranch },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tag },
  { to: '/admin/floor-plan', label: 'Floor Plan', icon: LayoutGrid },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="w-64 flex-shrink-0 bg-dark-850 border-r border-slate-700/40
                        flex flex-col"
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1220 100%)' }}>
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500
                            to-primary-700 flex items-center justify-center shadow-lg
                            shadow-primary-500/30">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-display font-bold text-slate-100 text-base leading-tight">POS Cafe</p>
              <p className="text-xs text-slate-500">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-200 group
                 ${isActive
                  ? 'bg-primary-500/15 text-primary-400 border border-primary-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="px-3 py-4 border-t border-slate-700/40">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-800/60 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center
                            justify-center text-sm font-bold text-primary-400 flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm
                       text-slate-400 hover:text-red-400 hover:bg-red-500/10
                       transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
