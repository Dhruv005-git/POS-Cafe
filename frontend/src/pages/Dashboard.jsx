import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, Tooltip,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, ShoppingBag, TableProperties,
  TrendingUp, RefreshCw, ChevronDown,
  Banknote, CreditCard, Smartphone,
  ArrowUpRight, UtensilsCrossed,
} from 'lucide-react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

// ── Constants ────────────────────────────────────────────────────────────────
const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'week',  label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const PIE_COLORS  = ['#6366f1','#f59e0b','#10b981','#f43f5e','#3b82f6','#a855f7'];
const METHOD_META = {
  cash:  { label: 'Cash',   icon: Banknote,    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  card:  { label: 'Card',   icon: CreditCard,  color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  upi:   { label: 'UPI',    icon: Smartphone,  color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20'  },
};

const STATUS_BADGE = {
  draft:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sent:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ready:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  paid:      'bg-primary-500/20 text-primary-400 border-primary-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// ── Skeleton loader ──────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-slate-700/40 rounded-lg ${className}`} />
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, icon: Icon, color, loading, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ) : (
        <div>
          <p className="font-display font-bold text-3xl text-slate-100">{value}</p>
          {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
        </div>
      )}
    </motion.div>
  );
}

// ── Custom Tooltip for charts ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-slate-700/50 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold text-slate-100">
            {p.name === 'Revenue' ? `$${p.value.toFixed(2)}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Period Selector ──────────────────────────────────────────────────────────
function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 bg-dark-900 border border-slate-700/50 rounded-xl p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
            ${value === p.value
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
              : 'text-slate-400 hover:text-slate-200'}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ── Payment Method Breakdown ─────────────────────────────────────────────────
function MethodBreakdown({ data, loading }) {
  if (loading) return (
    <div className="space-y-3">
      {[0,1,2].map(i => <Skeleton key={i} className="h-14" />)}
    </div>
  );

  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <Banknote className="w-8 h-8 text-slate-700" />
      <p className="text-slate-600 text-sm">No payment data</p>
    </div>
  );

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="space-y-3">
      {data.map((m, i) => {
        const meta = METHOD_META[m._id] || METHOD_META.cash;
        const Icon = meta.icon;
        const pct = total > 0 ? ((m.revenue / total) * 100).toFixed(1) : 0;
        return (
          <motion.div
            key={m._id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-3 p-3 rounded-xl border ${meta.bg} ${meta.border}`}
          >
            <div className={`w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${meta.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-200">{meta.label}</span>
                <span className={`text-sm font-bold ${meta.color}`}>${m.revenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    className={`h-full rounded-full ${meta.color.replace('text-', 'bg-')}`}
                  />
                </div>
                <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Top Products ─────────────────────────────────────────────────────────────
function TopProducts({ data, loading }) {
  if (loading) return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10" />)}
    </div>
  );
  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <UtensilsCrossed className="w-8 h-8 text-slate-700" />
      <p className="text-slate-600 text-sm">No product data</p>
    </div>
  );

  const maxRev = data[0]?.revenue ?? 1;

  return (
    <div className="space-y-2.5">
      {data.map((p, i) => (
        <motion.div
          key={p._id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex items-center gap-3"
        >
          <span className="text-slate-600 text-xs font-bold w-4 text-right flex-shrink-0">
            {i + 1}
          </span>
          <span className="text-xl flex-shrink-0">{p.emoji || '🍽️'}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-slate-200 truncate font-medium">{p.name}</span>
              <span className="text-sm font-bold text-slate-300 ml-2 flex-shrink-0">
                ${p.revenue.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(p.revenue / maxRev) * 100}%` }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.07 }}
                  className="h-full bg-primary-500/70 rounded-full"
                />
              </div>
              <span className="text-xs text-slate-600 w-12 text-right flex-shrink-0">
                ×{p.qty} sold
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Recent Orders Table ──────────────────────────────────────────────────────
function RecentOrders({ data, loading }) {
  if (loading) return (
    <div className="space-y-2 px-4">
      {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12" />)}
    </div>
  );
  if (!data?.length) return (
    <div className="flex flex-col items-center justify-center py-10 gap-2">
      <ShoppingBag className="w-8 h-8 text-slate-700" />
      <p className="text-slate-600 text-sm">No orders in this period</p>
    </div>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50">
            {['Order', 'Table', 'Items', 'Total', 'Method', 'Status', 'Time'].map(h => (
              <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider
                                     font-medium px-4 py-3 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/20">
          {data.map((order, i) => (
            <motion.tr
              key={order._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="hover:bg-slate-700/10 transition-colors"
            >
              <td className="px-4 py-3 font-mono font-bold text-primary-400 text-xs">
                {order.orderNumber}
              </td>
              <td className="px-4 py-3 text-slate-300">
                {order.tableNumber ? `T${order.tableNumber}` : '—'}
              </td>
              <td className="px-4 py-3 text-slate-400">
                {order.items?.length ?? 0} item{order.items?.length !== 1 ? 's' : ''}
              </td>
              <td className="px-4 py-3 font-semibold text-slate-200">
                ${order.total?.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                {order.paymentMethod ? (
                  <span className={`text-xs font-medium capitalize
                    ${METHOD_META[order.paymentMethod]?.color || 'text-slate-400'}`}>
                    {METHOD_META[order.paymentMethod]?.label || order.paymentMethod}
                  </span>
                ) : (
                  <span className="text-slate-600">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={`badge border text-xs capitalize
                  ${STATUS_BADGE[order.status] || STATUS_BADGE.draft}`}>
                  {order.status}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                {new Date(order.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit', minute: '2-digit', hour12: true,
                })}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('today');
  const [refreshing, setRefreshing] = useState(false);

  const [summary, setSummary]         = useState(null);
  const [hourly, setHourly]           = useState([]);
  const [products, setProducts]       = useState([]);
  const [categories, setCategories]   = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const [loadingSummary, setLoadingSummary]   = useState(true);
  const [loadingCharts, setLoadingCharts]     = useState(true);
  const [loadingOrders, setLoadingOrders]     = useState(true);

  const fetchAll = useCallback(async (p) => {
    setLoadingSummary(true);
    setLoadingCharts(true);
    setLoadingOrders(true);

    try {
      const [s, h, prod, cat, recent] = await Promise.all([
        api.get(`/reports/summary?period=${p}`),
        api.get(`/reports/by-hour?period=${p}`),
        api.get(`/reports/by-product?period=${p}&limit=8`),
        api.get(`/reports/by-category?period=${p}`),
        api.get(`/reports/recent-orders?period=${p}&limit=12`),
      ]);
      setSummary(s.data);
      setHourly(h.data.hours);
      setProducts(prod.data.products);
      setCategories(cat.data.categories);
      setRecentOrders(recent.data.orders);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoadingSummary(false);
      setLoadingCharts(false);
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => { fetchAll(period); }, [period, fetchAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll(period);
    setRefreshing(false);
  };

  // Show only hours with data + a few around them for readability
  const chartHours = hourly.filter(h => {
    const hasData = h.revenue > 0;
    const neighbourHasData = hourly.some(
      (n, idx) => Math.abs(n.hour - h.hour) <= 1 && n.revenue > 0
    );
    return hasData || neighbourHasData || (h.hour >= 8 && h.hour <= 22);
  });

  return (
    <div className="min-h-screen bg-dark-900 p-6 space-y-6"
      style={{
        backgroundImage:
          'radial-gradient(ellipse at 20% 10%, rgba(99,102,241,0.05) 0%, transparent 50%)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Welcome back, {user?.name} · {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2 px-3 py-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* ── KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Sales"
          value={loadingSummary ? '...' : `$${summary?.totalSales?.toFixed(2) ?? '0.00'}`}
          subtitle="Paid orders only"
          icon={DollarSign}
          color="bg-primary-500/15 text-primary-400"
          loading={loadingSummary}
          delay={0}
        />
        <KpiCard
          title="Total Orders"
          value={loadingSummary ? '...' : summary?.totalOrders ?? 0}
          subtitle="Completed this period"
          icon={ShoppingBag}
          color="bg-amber-500/15 text-amber-400"
          loading={loadingSummary}
          delay={0.07}
        />
        <KpiCard
          title="Avg Order Value"
          value={loadingSummary ? '...' : `$${summary?.avgOrderValue?.toFixed(2) ?? '0.00'}`}
          subtitle="Per paid order"
          icon={TrendingUp}
          color="bg-emerald-500/15 text-emerald-400"
          loading={loadingSummary}
          delay={0.14}
        />
        <KpiCard
          title="Active Tables"
          value={loadingSummary ? '...' : summary?.activeTables ?? 0}
          subtitle="Currently occupied"
          icon={TableProperties}
          color="bg-blue-500/15 text-blue-400"
          loading={loadingSummary}
          delay={0.21}
        />
      </div>

      {/* ── Revenue Chart + Method Breakdown ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-slate-200">Revenue Over Time</h2>
              <p className="text-xs text-slate-500 mt-0.5">Hourly sales breakdown</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-600" />
          </div>

          {loadingCharts ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartHours} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `$${v}`}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#1e293b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Payment method breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="card p-5"
        >
          <div className="mb-5">
            <h2 className="font-display font-semibold text-slate-200">Payment Methods</h2>
            <p className="text-xs text-slate-500 mt-0.5">Revenue by method</p>
          </div>
          <MethodBreakdown data={summary?.byMethod} loading={loadingSummary} />
        </motion.div>
      </div>

      {/* ── Orders by Hour (Bar) + Category Pie ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart — order count */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-slate-200">Orders Per Hour</h2>
              <p className="text-xs text-slate-500 mt-0.5">Order volume by time</p>
            </div>
          </div>
          {loadingCharts ? (
            <Skeleton className="h-52 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartHours} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={2}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={30}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar
                  dataKey="orders"
                  name="Orders"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Category pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="card p-5"
        >
          <div className="mb-4">
            <h2 className="font-display font-semibold text-slate-200">By Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">Revenue distribution</p>
          </div>
          {loadingCharts ? (
            <Skeleton className="h-52 w-full" />
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 gap-2">
              <UtensilsCrossed className="w-8 h-8 text-slate-700" />
              <p className="text-slate-600 text-sm">No data</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="revenue"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {categories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`$${v.toFixed(2)}`, 'Revenue']}
                    contentStyle={{
                      background: '#1e293b', border: '1px solid rgba(100,116,139,0.3)',
                      borderRadius: 12, color: '#e2e8f0', fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categories.slice(0, 5).map((c, i) => (
                  <div key={c._id} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                         style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-400 flex-1 truncate">{c._id}</span>
                    <span className="text-slate-300 font-medium">${c.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Top Products + Recent Orders ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="card p-5"
        >
          <div className="mb-5">
            <h2 className="font-display font-semibold text-slate-200">Top Products</h2>
            <p className="text-xs text-slate-500 mt-0.5">By revenue this period</p>
          </div>
          <TopProducts data={products} loading={loadingCharts} />
        </motion.div>

        {/* Recent orders table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="card overflow-hidden lg:col-span-2"
        >
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-slate-200">Recent Orders</h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest activity this period</p>
            </div>
            <span className="text-xs text-slate-600">
              {recentOrders.length} shown
            </span>
          </div>
          <RecentOrders data={recentOrders} loading={loadingOrders} />
        </motion.div>
      </div>
    </div>
  );
}