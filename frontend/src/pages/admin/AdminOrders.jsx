import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, Filter, Search, Eye,
  Banknote, CreditCard, Smartphone, ChevronDown,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  draft:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sent:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ready:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  paid:      'bg-primary-500/20 text-primary-400 border-primary-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const METHOD_META = {
  cash: { label: 'Cash',  icon: Banknote,    color: 'text-emerald-400' },
  card: { label: 'Card',  icon: CreditCard,  color: 'text-blue-400' },
  upi:  { label: 'UPI',   icon: Smartphone,  color: 'text-purple-400' },
};

const STATUSES = ['all', 'draft', 'sent', 'preparing', 'ready', 'paid', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/orders${params}`);
      setOrders(data.orders);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o =>
    !search ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.tableNumber).includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100">Orders</h1>
        <p className="text-slate-500 text-sm mt-0.5">View-only — {orders.length} orders loaded</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search order # or table..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 capitalize
                ${statusFilter === s
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                  : 'text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-600'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-slate-700/40 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['Order', 'Table', 'Items', 'Total', 'Method', 'Status', 'Customer', 'Time'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider
                                         font-medium px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-700/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => {
                  const Method = order.paymentMethod ? METHOD_META[order.paymentMethod] : null;
                  const isExpanded = expanded === order._id;
                  return (
                    <>
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-slate-700/10 transition-colors cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : order._id)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary-400 text-xs">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {order.tableNumber ? `T${order.tableNumber}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {order.items?.length ?? 0}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {Method ? (
                            <span className={`text-xs font-medium flex items-center gap-1 ${Method.color}`}>
                              <Method.icon className="w-3 h-3" /> {Method.label}
                            </span>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge border text-xs capitalize ${STATUS_BADGE[order.status] || STATUS_BADGE.draft}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {order.customerId ? (
                            <span className="text-emerald-400">🙋 Linked</span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </td>
                      </motion.tr>
                      {/* Expanded items row */}
                      {isExpanded && (
                        <tr key={order._id + '-exp'} className="bg-dark-900/50">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {order.items?.map((item, idx) => (
                                <span key={idx}
                                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1
                                             bg-dark-700 text-slate-300 rounded-lg border border-slate-700/50">
                                  <span>{item.emoji || '🍽️'}</span>
                                  <span>{item.name}</span>
                                  <span className="text-slate-500">×{item.quantity}</span>
                                </span>
                              ))}
                              {order.notes && (
                                <span className="text-xs text-amber-400">📝 {order.notes}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
