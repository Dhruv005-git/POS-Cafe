import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, WifiOff, CheckCircle, Clock, Coffee,
  ShoppingBag, ChevronDown, ChevronUp, LogOut,
} from 'lucide-react';
import api from '../api/axios.js';
import { useSocketEvent, useSocketConnected } from '../hooks/useSocket.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// ── Helpers ──────────────────────────────────────────────────────────────────
function useCurrentTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return { time, date };
}

const STATUS_CONFIG = {
  draft:     { label: 'Order Received',   color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/30',   dot: 'bg-slate-400',    pulse: false },
  sent:      { label: 'Sent to Kitchen',  color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   dot: 'bg-amber-400',    pulse: true  },
  preparing: { label: 'Being Prepared',   color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  dot: 'bg-orange-400',   pulse: true  },
  ready:     { label: 'Ready to Serve!',  color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-400',  pulse: false },
  paid:      { label: 'Payment Complete', color: 'text-primary-300', bg: 'bg-primary-500/10', border: 'border-primary-500/30', dot: 'bg-primary-400',  pulse: false },
  cancelled: { label: 'Cancelled',        color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30',    dot: 'bg-red-400',      pulse: false },
};

// ── Idle / Welcome screen (passive kiosk) ────────────────────────────────────
function IdleScreen() {
  const time = useCurrentTime();
  return (
    <motion.div
      key="idle"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-1 flex flex-col items-center justify-center gap-8 px-8"
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700
                        flex items-center justify-center shadow-2xl shadow-primary-500/30">
          <span className="text-6xl">☕</span>
        </div>
        <h1 className="font-display font-bold text-5xl text-slate-100 tracking-tight">POS Cafe</h1>
        <p className="text-slate-500 text-xl">Welcome! Please place your order.</p>
      </motion.div>
      <div className="w-24 h-px bg-slate-700" />
      <div className="text-center">
        <p className="font-display font-bold text-6xl text-slate-200 tabular-nums tracking-tight">{time.time}</p>
        <p className="text-slate-500 text-lg mt-2">{time.date}</p>
      </div>
      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="text-slate-600 text-base text-center max-w-xs"
      >
        Your order will appear here once placed
      </motion.p>
    </motion.div>
  );
}

// ── Active Order Screen (passive) ────────────────────────────────────────────
function ActiveOrderScreen({ order }) {
  const isPaid = order.paymentStatus === 'paid';
  const cfg = isPaid ? STATUS_CONFIG.paid : (STATUS_CONFIG[order.status] || STATUS_CONFIG.draft);

  return (
    <motion.div
      key="active"
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-8 py-10 gap-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm uppercase tracking-widest font-medium mb-1">Order</p>
          <h2 className="font-display font-bold text-4xl text-slate-100">{order.orderNumber}</h2>
          {order.tableNumber && <p className="text-slate-500 text-base mt-1">Table {order.tableNumber}</p>}
        </div>
        <motion.div
          key={cfg.label}
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 ${cfg.bg} ${cfg.border}`}
        >
          <motion.div
            className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`}
            animate={cfg.pulse ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className={`font-display font-bold text-lg ${cfg.color}`}>{cfg.label}</span>
        </motion.div>
      </div>

      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Your Items</span>
          <span className="ml-auto text-xs text-slate-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">
          {order.items.map((item, idx) => (
            <motion.div key={item._id}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 px-6 py-4"
            >
              <span className="text-3xl">{item.emoji || '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-200 text-lg truncate">{item.name}</p>
                {item.notes && <p className="text-sm text-amber-400 mt-0.5">📝 {item.notes}</p>}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <span className="text-slate-500 text-base">×{item.quantity}</span>
                <span className="font-semibold text-slate-200 text-lg w-20 text-right">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="border-t border-slate-700/50 px-6 py-4 space-y-2">
          <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
          <div className="flex justify-between text-slate-400"><span>Tax (5%)</span><span>${order.tax?.toFixed(2)}</span></div>
          <div className="flex justify-between pt-2 border-t border-slate-700/40">
            <span className="font-display font-bold text-2xl text-slate-100">Total</span>
            <span className="font-display font-bold text-2xl text-primary-400">${order.total?.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isPaid ? (
          <motion.div key="paid"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 py-6 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30"
          >
            <CheckCircle className="w-12 h-12 text-emerald-400" />
            <div className="text-center">
              <p className="font-display font-bold text-2xl text-emerald-300">Payment Complete!</p>
              <p className="text-emerald-500/80 text-sm mt-1">Thank you for visiting POS Cafe ☕</p>
            </div>
          </motion.div>
        ) : (
          <motion.div key="awaiting"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-dark-800 border border-slate-700/40"
          >
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.8, repeat: Infinity }}>
              <Clock className="w-5 h-5 text-slate-500" />
            </motion.div>
            <span className="text-slate-400 text-base">Awaiting payment...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Customer Portal (authenticated mode) ─────────────────────────────────────
function CustomerPortal({ user, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const connected = useSocketConnected();

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/customers/me/orders');
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Live updates for active orders
  useSocketEvent('order_update', (order) => {
    setOrders(prev => prev.map(o => o._id === order._id ? { ...o, ...order } : o));
  });
  useSocketEvent('payment_done', ({ orderId }) => {
    setOrders(prev => prev.map(o => o._id === orderId
      ? { ...o, paymentStatus: 'paid', status: 'paid' }
      : o
    ));
  });

  const active = orders.filter(o => !['paid', 'cancelled'].includes(o.status));
  const past = orders.filter(o => ['paid', 'cancelled'].includes(o.status));

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-100">My Orders</h1>
            <p className="text-slate-500 text-sm mt-0.5">Welcome back, {user.name} 👋</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border
              ${connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {connected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Offline</>}
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400
                         hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent
                         hover:border-red-500/20">
              <LogOut className="w-3 h-3" /> Sign out
            </button>
          </div>
        </div>

        {/* Active orders */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
            ))}
          </div>
        ) : active.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Active Orders</p>
            {active.map(order => {
              const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
              return (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-dark-800 border-2 rounded-2xl overflow-hidden ${cfg.border}`}
                >
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-mono font-bold text-primary-400 text-sm">{order.orderNumber}</p>
                      {order.tableNumber && (
                        <p className="text-xs text-slate-500">Table {order.tableNumber}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                        <motion.div
                          className={`w-2 h-2 rounded-full ${cfg.dot}`}
                          animate={cfg.pulse ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] } : {}}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                        <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <span className="font-bold text-slate-200">${order.total?.toFixed(2)}</span>
                      <button onClick={() => setExpanded(e => e === order._id ? null : order._id)}
                        className="text-slate-500 hover:text-slate-300 transition-colors">
                        {expanded === order._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expanded === order._id && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-slate-700/40"
                      >
                        <div className="px-5 py-3 space-y-2">
                          {order.items?.map(item => (
                            <div key={item._id} className="flex items-center gap-3 text-sm">
                              <span className="text-lg">{item.emoji || '🍽️'}</span>
                              <span className="flex-1 text-slate-300">{item.name}</span>
                              <span className="text-slate-500">×{item.quantity}</span>
                              <span className="text-slate-400">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : null}

        {/* Order history */}
        <div className="space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">
            {active.length === 0 && past.length === 0 ? 'No orders yet' : 'Order History'}
          </p>
          {past.length === 0 && active.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ShoppingBag className="w-12 h-12 text-slate-700" />
              <p className="text-slate-500">Your orders will appear here</p>
            </div>
          )}
          {past.map(order => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.paid;
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800 border border-slate-700/40 rounded-xl overflow-hidden"
              >
                <button
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-700/10 transition-colors"
                  onClick={() => setExpanded(e => e === order._id ? null : order._id)}
                >
                  <div className="flex items-center gap-3">
                    <p className="font-mono font-bold text-slate-400 text-sm">{order.orderNumber}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-300">${order.total?.toFixed(2)}</span>
                    <span className="text-xs text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    {expanded === order._id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>
                <AnimatePresence>
                  {expanded === order._id && (
                    <motion.div
                      initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-slate-700/30"
                    >
                      <div className="px-5 py-3 space-y-2">
                        {order.items?.map(item => (
                          <div key={item._id} className="flex items-center gap-3 text-sm">
                            <span className="text-base">{item.emoji || '🍽️'}</span>
                            <span className="flex-1 text-slate-400">{item.name}</span>
                            <span className="text-slate-500">×{item.quantity}</span>
                            <span className="text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CustomerDisplay() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const connected = useSocketConnected();

  // Passive kiosk state
  const [activeOrder, setActiveOrder] = useState(null);
  const [loadingPassive, setLoadingPassive] = useState(true);

  // Passive mode: fetch latest orders if not logged-in as customer
  const fetchLatestActive = useCallback(async () => {
    if (user) return; // skip for authenticated customers
    try {
      const statuses = ['sent', 'preparing', 'ready', 'draft'];
      const results = await Promise.all(
        statuses.map(s => api.get(`/orders?status=${s}`).then(r => r.data.orders))
      );
      const all = results.flat().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setActiveOrder(all[0] || null);
    } catch {
      setActiveOrder(null);
    } finally {
      setLoadingPassive(false);
    }
  }, [user]);

  useEffect(() => { fetchLatestActive(); }, [fetchLatestActive]);

  // Passive socket events
  useSocketEvent('new_order', (order) => { if (!user) setActiveOrder(order); });
  useSocketEvent('order_update', (order) => {
    if (!user) setActiveOrder(prev => prev?._id === order._id ? order : prev);
  });
  useSocketEvent('payment_done', ({ orderId }) => {
    if (!user) {
      setActiveOrder(prev => {
        if (!prev || prev._id !== orderId) return prev;
        return { ...prev, paymentStatus: 'paid', status: 'paid' };
      });
      setTimeout(() => {
        setActiveOrder(cur => (cur?._id === orderId ? null : cur));
      }, 6000);
    }
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="min-h-screen bg-dark-900 flex flex-col select-none"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 30% 60%, rgba(99,102,241,0.07) 0%, transparent 55%),' +
          'radial-gradient(ellipse at 75% 20%, rgba(245,158,11,0.04) 0%, transparent 45%)',
      }}
    >
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-slate-700/30
                         bg-dark-800/60 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700
                          flex items-center justify-center">
            <Coffee className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-slate-100 text-lg">POS Cafe</span>
          <span className="text-slate-600 text-sm">·{user ? ' My Orders' : ' Customer Display'}</span>
        </div>

        {!user && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border
            ${connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {connected
              ? <><Wifi className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> Reconnecting...</>}
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Authenticated customer → personal portal */}
        {user?.role === 'customer' ? (
          <CustomerPortal user={user} onLogout={handleLogout} />
        ) : (
          // Passive kiosk display
          loadingPassive ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeOrder
                ? <ActiveOrderScreen key={activeOrder._id} order={activeOrder} />
                : <IdleScreen key="idle" />
              }
            </AnimatePresence>
          )
        )}
      </div>

      {!user && (
        <footer className="px-8 py-3 border-t border-slate-700/20 flex items-center justify-center flex-shrink-0">
          <p className="text-slate-700 text-xs">Powered by POS Cafe · Thank you for your visit</p>
        </footer>
      )}
    </div>
  );
}