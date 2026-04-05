import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSession } from '../../hooks/useSession.js';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Coffee, User, LayoutDashboard, Building2, ChevronDown, Square } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import CloseSessionModal from '../POS/CloseSessionModal.jsx';

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
  const { user, logout, selectedBranch, setSelectedBranch } = useAuth();
  const { session, closing, closeSession, refreshSession } = useSession(selectedBranch?._id);
  const navigate = useNavigate();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenCloseModal = async () => {
    // Refresh session from DB first so we see live cashSales
    setRefreshing(true);
    await refreshSession();
    setRefreshing(false);
    setShowCloseModal(true);
  };

  const handleCloseSession = async (closingCash) => {
    const closed = await closeSession(closingCash);
    if (closed) {
      setShowCloseModal(false);
      // Stay on floor — will show Opening Balance modal again for next shift
    }
  };

  const isStaff = user?.role === 'staff' || user?.role === 'cashier';
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <header className="bg-dark-800 border-b border-slate-700/50 px-6 py-3 flex items-center justify-between z-10">

        {/* LEFT: Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Coffee className="w-4 h-4 text-primary-400" />
          </div>
          <span className="font-display font-bold text-slate-100 text-lg">POS Cafe</span>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">

          {/* ADMIN only: Admin Panel link */}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="btn-secondary flex items-center gap-2 px-3 py-1.5 text-sm"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Panel
            </Link>
          )}

          {/* STAFF: Branch indicator + switch */}
          {(isStaff || isAdmin) && selectedBranch && (
            <button
              onClick={() => {
                setSelectedBranch(null);
                navigate('/pos/floor'); // go to branch selector
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl
                         bg-primary-500/10 border border-primary-500/25
                         text-primary-400 text-sm font-medium
                         hover:bg-primary-500/20 transition-colors"
              title="Click to switch branch"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{selectedBranch.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          )}

          {/* STAFF: Close Session button (only when session is active) */}
          {(isStaff || isAdmin) && session && (
            <button
              onClick={handleOpenCloseModal}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                         bg-red-500/10 border border-red-500/25 text-red-400
                         hover:bg-red-500/20 transition-colors disabled:opacity-60"
            >
              {refreshing
                ? <span className="w-3 h-3 border border-red-400/50 border-t-red-400 rounded-full animate-spin" />
                : <Square className="w-3 h-3 fill-red-400" />}
              Close Session
            </button>
          )}

          {/* Customer Display — only for register-only branches */}
          {(isStaff || isAdmin) && selectedBranch?.hasFloorPlan === false && (
            <button
              onClick={() => window.open('/customer', '_blank')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                         bg-slate-700/60 border border-slate-600/40 text-slate-300
                         hover:bg-slate-700 transition-colors"
              title="Open Customer Display in new tab"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-primary-400" />
              Customer Display
            </button>
          )}

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-primary-500/20 rounded-full flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary-400" />
              </div>
              <span className="text-sm text-slate-300">{user.name}</span>
              <span className={`${roleColors[user.role] || 'badge-primary'} badge text-[10px]`}>
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

      {/* Close Session Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <CloseSessionModal
            session={session}
            closing={closing}
            onClose={() => setShowCloseModal(false)}
            onConfirm={handleCloseSession}
          />
        )}
      </AnimatePresence>
    </>
  );
}