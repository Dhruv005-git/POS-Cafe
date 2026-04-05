import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Clock, Wifi, WifiOff, CheckCheck, Flame, UtensilsCrossed,
  LogOut, Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Tag,
} from 'lucide-react';
import api from '../api/axios.js';
import { useSocketEvent, useSocketConnected } from '../hooks/useSocket.js';
import { sound } from '../utils/sound.js';

// ─── Web Audio beep ───────────────────────────────────────────────────────────
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

// ─── Elapsed time ─────────────────────────────────────────────────────────────
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
  const urgent = diff > 600;

  return (
    <span className={`flex items-center gap-1 text-xs font-mono font-bold
      ${urgent ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
      <Clock className="w-3 h-3" />
      {elapsed}
    </span>
  );
}

// ─── Column config (unchanged) ────────────────────────────────────────────────
const columnConfig = {
  sent:      { label: 'To Cook',   icon: Flame,      border: 'border-red-500/40',     glow: 'shadow-red-500/10',     badge: 'bg-red-500/20 text-red-300 border-red-500/30',         dot: 'bg-red-400' },
  preparing: { label: 'Preparing', icon: ChefHat,    border: 'border-amber-500/40',   glow: 'shadow-amber-500/10',   badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',   dot: 'bg-amber-400' },
  ready:     { label: 'Ready',     icon: CheckCheck, border: 'border-emerald-500/40', glow: 'shadow-emerald-500/10', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
};

// ─── Order Card (unchanged) ───────────────────────────────────────────────────
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
              {item.selectedExtras?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {item.selectedExtras.map(e => (
                    <span key={e.name} className="text-[10px] font-semibold px-1.5 py-0.5
                      rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                      ✨ {e.name}
                    </span>
                  ))}
                </div>
              )}
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

// ─── Pagination controls ──────────────────────────────────────────────────────
const PAGE_SIZE = 4;

function Pager({ page, total, onPrev, onNext }) {
  if (total <= 1) return null;
  const start = page * PAGE_SIZE + 1;
  const end   = Math.min((page + 1) * PAGE_SIZE, total);
  return (
    <div className="flex items-center justify-center gap-2 pt-2 pb-1">
      <button
        onClick={onPrev}
        disabled={page === 0}
        className="w-7 h-7 rounded-lg bg-dark-700 border border-slate-700/40 flex items-center justify-center
                   text-slate-400 hover:text-slate-200 hover:bg-dark-600 disabled:opacity-30 transition-all"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <span className="text-xs text-slate-500 font-mono tabular-nums">
        {start}–{end} <span className="text-slate-700">/ {total}</span>
      </span>
      <button
        onClick={onNext}
        disabled={(page + 1) * PAGE_SIZE >= total}
        className="w-7 h-7 rounded-lg bg-dark-700 border border-slate-700/40 flex items-center justify-center
                   text-slate-400 hover:text-slate-200 hover:bg-dark-600 disabled:opacity-30 transition-all"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main KitchenDisplay ──────────────────────────────────────────────────────
export default function KitchenDisplay() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const connected                       = useSocketConnected();
  const audioUnlocked                   = useRef(false);

  // ── Filter & search state ─────────────────────────────────────────────────
  const [search, setSearch]               = useState('');
  const [filterProduct, setFilterProduct] = useState(null);
  const [filterCategory, setFilterCategory] = useState(null);
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  // Per-column pagination
  const [colPages, setColPages] = useState({ sent: 0, preparing: 0, ready: 0 });

  // Product→category map (fetched once from /products)
  const [productCatMap, setProductCatMap] = useState({}); // { productName: categoryName }

  useEffect(() => {
    api.get('/products').then(({ data }) => {
      const map = {};
      (data.products || []).forEach(p => { if (p.name && p.category) map[p.name] = p.category; });
      setProductCatMap(map);
    }).catch(() => {});
  }, []);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get('/orders?status=sent'),
        api.get('/orders?status=preparing'),
        api.get('/orders?status=ready'),
      ]);
      setOrders([...r1.data.orders, ...r2.data.orders, ...r3.data.orders]);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Unlock audio
  useEffect(() => {
    const unlock = () => { audioUnlocked.current = true; };
    window.addEventListener('click', unlock, { once: true });
    return () => window.removeEventListener('click', unlock);
  }, []);

  // ── Socket events (unchanged) ────────────────────────────────────────────
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
      if (['paid', 'cancelled'].includes(order.status)) return prev.filter(o => o._id !== order._id);
      const exists = prev.find(o => o._id === order._id);
      if (exists) return prev.map(o => o._id === order._id ? order : o);
      return prev;
    });
  });

  useSocketEvent('payment_done', ({ orderId }) => {
    setOrders(prev => prev.filter(o => o._id !== orderId));
  });

  // ── Handlers (unchanged) ─────────────────────────────────────────────────
  const handleAdvance = async (orderId) => {
    try { await api.put(`/orders/${orderId}/advance`); } catch { /* silent */ }
  };

  const handleItemToggle = async (orderId, itemId, currentStatus) => {
    const newStatus = currentStatus === 'ready' ? 'preparing' : 'ready';
    try { await api.put(`/orders/${orderId}/item-status`, { itemId, status: newStatus }); } catch { /* silent */ }
  };

  // ── Derived filter lists ─────────────────────────────────────────────────
  const allProducts = useMemo(() => {
    const names = new Set();
    orders.forEach(o => o.items.forEach(i => names.add(i.name)));
    return [...names].sort();
  }, [orders]);

  const allCategories = useMemo(() => {
    const cats = new Set();
    orders.forEach(o => o.items.forEach(i => {
      const cat = productCatMap[i.name];
      if (cat) cats.add(cat);
    }));
    return [...cats].sort();
  }, [orders, productCatMap]);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const applyFilters = useCallback((list) => {
    return list.filter(order => {
      if (search) {
        const q = search.toLowerCase();
        const idMatch  = String(order.orderNumber || '').toLowerCase().includes(q);
        const itemMatch = order.items.some(i => i.name.toLowerCase().includes(q));
        if (!idMatch && !itemMatch) return false;
      }
      if (filterProduct && !order.items.some(i => i.name === filterProduct)) return false;
      if (filterCategory && !order.items.some(i => productCatMap[i.name] === filterCategory)) return false;
      return true;
    });
  }, [search, filterProduct, filterCategory, productCatMap]);

  const hasFilters = !!(search || filterProduct || filterCategory);

  const clearFilters = () => {
    setSearch('');
    setFilterProduct(null);
    setFilterCategory(null);
    setColPages({ sent: 0, preparing: 0, ready: 0 });
  };

  // Reset pages when filters change
  useEffect(() => {
    setColPages({ sent: 0, preparing: 0, ready: 0 });
  }, [search, filterProduct, filterCategory]);

  const columns = ['sent', 'preparing', 'ready'];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen bg-dark-900 flex flex-col transition-colors duration-300
        ${newOrderFlash ? 'bg-primary-500/5' : ''}`}
      style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.04) 0%, transparent 60%)' }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <header className="bg-dark-800 border-b border-slate-700/50 px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-primary-400" />
          </div>
          <span className="font-display font-bold text-lg text-slate-100">Kitchen Display</span>
          <span className="text-slate-600 text-sm hidden sm:inline">POS Cafe</span>
        </div>

        {/* Search bar */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order # or item…"
            className="w-full bg-dark-700 border border-slate-700/50 rounded-xl
                       pl-9 pr-9 py-1.5 text-sm text-slate-300 placeholder-slate-600
                       focus:outline-none focus:border-primary-500/50 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
            ${sidebarOpen
              ? 'bg-primary-500/15 text-primary-400 border-primary-500/30'
              : 'bg-dark-700 text-slate-400 border-slate-700/40 hover:bg-dark-600'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary-400" />}
        </button>

        {/* Right: stats + status + logout */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          <span className="text-xs text-slate-500">{orders.length} active</span>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border
            ${connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
            {connected ? <><Wifi className="w-3 h-3" /> Live</> : <><WifiOff className="w-3 h-3" /> Reconnecting...</>}
          </div>
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                       bg-slate-700/60 text-slate-400 border border-slate-700/40
                       hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Filter Sidebar ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-800 border-r border-slate-700/40 flex flex-col overflow-hidden flex-shrink-0"
            >
              <div className="overflow-y-auto flex-1 py-3">
                {/* Clear filters */}
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="mx-3 mb-3 w-[calc(100%-24px)] flex items-center justify-between
                               px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/20
                               text-primary-400 text-xs font-semibold hover:bg-primary-500/20 transition-colors"
                  >
                    Clear Filter
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Products */}
                <div className="px-3 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Product
                  </p>
                  <div className="space-y-0.5">
                    {allProducts.length === 0 ? (
                      <p className="text-xs text-slate-700 italic px-1">No orders yet</p>
                    ) : allProducts.map(name => (
                      <button
                        key={name}
                        onClick={() => setFilterProduct(filterProduct === name ? null : name)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                          ${filterProduct === name
                            ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                            : 'text-slate-400 hover:bg-dark-700 hover:text-slate-200'}`}
                      >
                        {filterProduct === name && <span className="mr-1">›</span>}
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-700/30 mx-3 my-3" />

                {/* Categories */}
                <div className="px-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">
                    Category
                  </p>
                  <div className="space-y-0.5">
                    {allCategories.length === 0 ? (
                      <p className="text-xs text-slate-700 italic px-1">—</p>
                    ) : allCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                          flex items-center gap-1.5
                          ${filterCategory === cat
                            ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                            : 'text-slate-400 hover:bg-dark-700 hover:text-slate-200'}`}
                      >
                        <Tag className="w-3 h-3 flex-shrink-0" />
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Column labels */}
          <div className="grid grid-cols-3 gap-4 px-6 pt-4 pb-2">
            {columns.map(col => {
              const cfg = columnConfig[col];
              const Icon = cfg.icon;
              const count = applyFilters(orders.filter(o => o.status === col)).length;
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
            <div className="flex-1 grid grid-cols-3 gap-4 px-6 pb-4 pt-2 overflow-hidden">
              {columns.map(col => {
                const filtered = applyFilters(orders.filter(o => o.status === col));
                const page      = colPages[col];
                const paged     = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

                return (
                  <div key={col} className="flex flex-col overflow-hidden">
                    {/* Scrollable cards */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      <AnimatePresence mode="popLayout">
                        {paged.length === 0 ? (
                          <motion.p
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-slate-700 text-center pt-8"
                          >
                            {hasFilters ? 'No matches' : 'Empty'}
                          </motion.p>
                        ) : paged.map(order => (
                          <OrderCard
                            key={order._id}
                            order={order}
                            onAdvance={handleAdvance}
                            onItemToggle={handleItemToggle}
                          />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    <Pager
                      page={page}
                      total={filtered.length}
                      onPrev={() => setColPages(p => ({ ...p, [col]: Math.max(0, p[col] - 1) }))}
                      onNext={() => setColPages(p => ({ ...p, [col]: p[col] + 1 }))}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}