import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, Wifi, WifiOff, CheckCheck, Flame, UtensilsCrossed } from 'lucide-react';
import api from '../api/axios.js';
import { useSocketEvent, useSocketConnected } from '../hooks/useSocket.js';
import { sound } from '../utils/sound.js';

// Web Audio API — simple beep for new orders
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch { /* audio not available */ }
}

// Elapsed time display
function TimeElapsed({ createdAt }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
      if (diff < 60) setElapsed(`${diff}s`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m ${diff % 60}s`);
      else setElapsed(`${Math.floor(diff / 3600)}h`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
  const urgent = diff > 600; // > 10 min

  return (
    <span className={`flex items-center gap-1 text-xs font-mono font-bold
      ${urgent ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
      <Clock className="w-3 h-3" />
      {elapsed}
    </span>
  );
}

const columnConfig = {
  sent:      { label: 'To Cook',   icon: Flame,           border: 'border-red-500/40',    glow: 'shadow-red-500/10',    badge: 'bg-red-500/20 text-red-300 border-red-500/30',    dot: 'bg-red-400' },
  preparing: { label: 'Preparing', icon: ChefHat,         border: 'border-amber-500/40',  glow: 'shadow-amber-500/10',  badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',  dot: 'bg-amber-400' },
  ready:     { label: 'Ready',     icon: CheckCheck,      border: 'border-emerald-500/40',glow: 'shadow-emerald-500/10',badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
};

function OrderCard({ order, onAdvance, onItemToggle }) {
  const cfg = columnConfig[order.status] || columnConfig.sent;
  const Icon = cfg.icon;
  const canAdvance = order.status !== 'ready';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`bg-dark-800 border-2 ${cfg.border} rounded-2xl shadow-xl ${cfg.glow} overflow-hidden`}
    >
      {/* Card header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="font-display font-bold text-slate-100 text-base">
            {order.orderNumber}
          </span>
          {order.tableNumber && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              T{order.tableNumber}
            </span>
          )}
        </div>
        <TimeElapsed createdAt={order.createdAt} />
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.items.map(item => (
          <button
            key={item._id}
            onClick={() => onItemToggle(order._id, item._id, item.status)}
            className={`w-full flex items-center gap-2.5 text-left group transition-all duration-150
              ${item.status === 'ready' ? 'opacity-40' : 'opacity-100'}`}
          >
            <span className="text-lg select-none">{item.emoji || '🍽️'}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium transition-all duration-150
                ${item.status === 'ready' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {item.name}
              </p>
              {item.notes && (
                <p className="text-xs text-amber-400 mt-0.5">📝 {item.notes}</p>
              )}
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
              ${item.status === 'ready'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-dark-700 text-slate-400'}`}>
              {item.quantity}
            </div>
          </button>
        ))}
      </div>

      {/* Advance button */}
      {canAdvance && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onAdvance(order._id)}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95
              ${order.status === 'sent'
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'}`}
          >
            {order.status === 'sent' ? '→ Start Preparing' : '✓ Mark Ready'}
          </button>
        </div>
      )}
    </motion.div>
  );
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const connected = useSocketConnected();
  const audioUnlocked = useRef(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders?status=sent');
      const { data: data2 } = await api.get('/orders?status=preparing');
      const { data: data3 } = await api.get('/orders?status=ready');
      setOrders([...data.orders, ...data2.orders, ...data3.orders]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Unlock audio on first user interaction (browser policy)
  useEffect(() => {
    const unlock = () => { audioUnlocked.current = true; };
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  useSocketEvent('new_order', (order) => {
    setOrders(prev => {
      const exists = prev.find(o => o._id === order._id);
      if (exists) return prev.map(o => o._id === order._id ? order : o);
      return [order, ...prev];
    });
    if (audioUnlocked.current) sound.newOrder();
    setNewOrderFlash(true);
    setTimeout(() => setNewOrderFlash(false), 1000);
  });

  useSocketEvent('order_update', (order) => {
    setOrders(prev => {
      // If order is now paid/cancelled, remove it
      if (['paid', 'cancelled'].includes(order.status)) {
        return prev.filter(o => o._id !== order._id);
      }
      const exists = prev.find(o => o._id === order._id);
      if (exists) return prev.map(o => o._id === order._id ? order : o);
      return prev;
    });
  });

  useSocketEvent('payment_done', ({ orderId }) => {
    setOrders(prev => prev.filter(o => o._id !== orderId));
  });

  const handleAdvance = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/advance`);
      // Optimistic update handled via socket event
    } catch { /* silent */ }
  };

  const handleItemToggle = async (orderId, itemId, currentStatus) => {
    const newStatus = currentStatus === 'ready' ? 'preparing' : 'ready';
    try {
      await api.put(`/orders/${orderId}/item-status`, { itemId, status: newStatus });
    } catch { /* silent */ }
  };

  const columns = ['sent', 'preparing', 'ready'];

  return (
    <div
      className={`min-h-screen bg-dark-900 flex flex-col transition-colors duration-300
        ${newOrderFlash ? 'bg-primary-500/5' : ''}`}
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 60%)',
      }}
    >
      {/* Kitchen top bar */}
      <header className="bg-dark-800 border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-primary-400" />
          </div>
          <span className="font-display font-bold text-lg text-slate-100">Kitchen Display</span>
          <span className="text-slate-600 text-sm">POS Cafe</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{orders.length} active order{orders.length !== 1 ? 's' : ''}</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border
            ${connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {connected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Reconnecting...</>}
          </div>
        </div>
      </header>

      {/* Column labels */}
      <div className="grid grid-cols-3 gap-4 px-6 pt-4 pb-2">
        {columns.map(col => {
          const cfg = columnConfig[col];
          const Icon = cfg.icon;
          const count = orders.filter(o => o.status === col).length;
          return (
            <div key={col} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <Icon className="w-4 h-4 text-slate-500" />
              <span className="font-display font-semibold text-slate-300 text-sm uppercase tracking-wider">
                {cfg.label}
              </span>
              <span className="ml-auto text-xs font-bold text-slate-500 bg-dark-800 px-2 py-0.5 rounded-full border border-slate-700/50">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Order columns */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading orders...</span>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <UtensilsCrossed className="w-16 h-16 text-slate-700" />
          <p className="font-display text-xl text-slate-600">All caught up!</p>
          <p className="text-slate-700 text-sm">No active orders in the kitchen.</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-3 gap-4 px-6 pb-6 pt-2 overflow-hidden">
          {columns.map(col => (
            <div key={col} className="overflow-y-auto space-y-3 pr-1">
              <AnimatePresence mode="popLayout">
                {orders
                  .filter(o => o.status === col)
                  .map(order => (
                    <OrderCard
                      key={order._id}
                      order={order}
                      onAdvance={handleAdvance}
                      onItemToggle={handleItemToggle}
                    />
                  ))}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}