import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Eye,
  Banknote, CreditCard, Smartphone, CheckCircle2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const PAGE_SIZE = 15;

const STATUS_BADGE = {
  draft:     'bg-slate-500/20 text-slate-400 border-slate-500/30',
  sent:      'bg-amber-500/20 text-amber-400 border-amber-500/30',
  preparing: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  ready:     'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  paid:      'bg-primary-500/20 text-primary-400 border-primary-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const METHODS = [
  { key: 'cash', label: 'Cash',  Icon: Banknote,   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/40 hover:bg-emerald-500/25' },
  { key: 'card', label: 'Card',  Icon: CreditCard,  color: 'text-blue-400',   bg: 'bg-blue-500/15 border-blue-500/40 hover:bg-blue-500/25' },
  { key: 'upi',  label: 'UPI',   Icon: Smartphone,  color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/40 hover:bg-purple-500/25' },
];

const METHOD_META = {
  cash: { label: 'Cash',  Icon: Banknote,   color: 'text-emerald-400' },
  card: { label: 'Card',  Icon: CreditCard, color: 'text-blue-400'   },
  upi:  { label: 'UPI',   Icon: Smartphone, color: 'text-purple-400' },
};

const STATUSES = ['all', 'draft', 'sent', 'preparing', 'ready', 'paid', 'cancelled'];

// Detect if order originated from mobile (no cashier assigned)
const isMobileOrder = (order) => !order.cashier && order.paymentStatus === 'unpaid';

export default function AdminOrders() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [paying, setPaying]       = useState(null);   // orderId being paid
  const [page, setPage]           = useState(0);

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

  // Reset to page 0 whenever filters/search change
  useEffect(() => { setPage(0); }, [statusFilter, search]);

  const collectPayment = async (orderId, method) => {
    setPaying(orderId);
    try {
      await api.put(`/orders/${orderId}/pay`, { method });
      toast.success(`✅ Payment collected via ${method.toUpperCase()}`);
      // Update locally immediately (optimistic)
      setOrders(prev => prev.map(o =>
        o._id === orderId
          ? { ...o, status: 'paid', paymentStatus: 'paid', paymentMethod: method }
          : o
      ));
      setExpanded(null);
    } catch {
      toast.error('Failed to process payment');
    } finally {
      setPaying(null);
    }
  };

  const filtered = orders.filter(o =>
    !search ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    String(o.tableNumber).includes(search) ||
    (o.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const unpaidCount = orders.filter(o =>
    o.paymentStatus === 'unpaid' && !['draft','cancelled'].includes(o.status)
  ).length;

  return (
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} order{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== orders.length && ` (filtered from ${orders.length})`}
          </p>
        </div>
        {unpaidCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl
            bg-amber-500/15 border border-amber-500/30 text-amber-400 text-sm font-semibold">
            💳 {unpaidCount} unpaid order{unpaidCount > 1 ? 's' : ''} need payment
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input pl-9 py-2 text-sm"
            placeholder="Search order #, table, or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 capitalize
                ${statusFilter === s
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                  : 'text-slate-500 border-slate-700/50 hover:text-slate-300 hover:border-slate-600'
                }`}>
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
                {['Order', 'Source', 'Table', 'Items', 'Total', 'Method', 'Status', 'Time', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs text-slate-500 uppercase tracking-wider
                                         font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/20">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-700/40 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500">No orders found</p>
                  </td>
                </tr>
              ) : (
                paged.map((order, i) => {
                  const Meth = order.paymentMethod ? METHOD_META[order.paymentMethod] : null;
                  const isExpanded = expanded === order._id;
                  const canPay = order.paymentStatus === 'unpaid' &&
                                 !['draft', 'cancelled', 'paid'].includes(order.status);
                  const mobile = isMobileOrder(order);
                  const isPaying = paying === order._id;

                  return (
                    <>
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className={`transition-colors cursor-pointer
                          ${isExpanded ? 'bg-slate-700/15' : 'hover:bg-slate-700/10'}
                          ${canPay && mobile ? 'border-l-2 border-amber-500/50' : ''}`}
                        onClick={() => setExpanded(isExpanded ? null : order._id)}
                      >
                        <td className="px-4 py-3 font-mono font-bold text-primary-400 text-xs">
                          {order.orderNumber}
                        </td>
                        <td className="px-4 py-3">
                          {mobile
                            ? <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/25">📱 Mobile</span>
                            : <span className="text-[11px] text-slate-500">🖥️ POS</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {order.tableNumber ? `T${order.tableNumber}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {order.items?.length ?? 0}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-200">
                          ₹{order.total?.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          {Meth ? (
                            <span className={`text-xs font-medium flex items-center gap-1 ${Meth.color}`}>
                              <Meth.Icon className="w-3 h-3" /> {Meth.label}
                            </span>
                          ) : <span className="text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge border text-xs capitalize ${STATUS_BADGE[order.status] || STATUS_BADGE.draft}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleString('en-IN', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          {canPay ? (
                            <button
                              onClick={() => setExpanded(isExpanded ? null : order._id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold border
                                bg-amber-500/15 text-amber-400 border-amber-500/40
                                hover:bg-amber-500/25 transition-all whitespace-nowrap">
                              💳 Collect
                            </button>
                          ) : order.status === 'paid' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="text-slate-700 text-xs">—</span>
                          )}
                        </td>
                      </motion.tr>

                      {/* Expanded row — items + payment */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr
                            key={order._id + '-exp'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-dark-900/60">
                            <td colSpan={9} className="px-6 py-4">
                              <div className="space-y-4">
                                {/* Items */}
                                <div>
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Items</p>
                                  <div className="flex flex-wrap gap-2">
                                    {order.items?.map((item, idx) => (
                                      <span key={idx}
                                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1
                                                   bg-dark-700 text-slate-300 rounded-lg border border-slate-700/50">
                                        <span>{item.emoji || '🍽️'}</span>
                                        <span>{item.name}</span>
                                        <span className="text-slate-500">×{item.quantity}</span>
                                        {item.selectedExtras?.map(e => (
                                          <span key={e.name} className="text-amber-400 text-[10px]">✨{e.name}</span>
                                        ))}
                                      </span>
                                    ))}
                                  </div>
                                  {order.notes && (
                                    <p className="text-xs text-amber-400 mt-2">📝 {order.notes}</p>
                                  )}
                                </div>

                                {/* Payment collection — only for unpaid non-draft orders */}
                                {canPay && (
                                  <div className="pt-3 border-t border-slate-700/30">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                      Collect Payment — <span className="text-primary-400">₹{order.total?.toFixed(2)}</span>
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                      {METHODS.map(({ key, label, Icon, color, bg }) => (
                                        <button
                                          key={key}
                                          disabled={isPaying}
                                          onClick={() => collectPayment(order._id, key)}
                                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl
                                            border font-semibold text-sm transition-all
                                            disabled:opacity-50 ${bg} ${color}`}>
                                          {isPaying
                                            ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                                            : <Icon className="w-4 h-4" />}
                                          {label}
                                        </button>
                                      ))}
                                    </div>
                                    <p className="text-xs text-slate-600 mt-2">
                                      Click a method to mark order as paid and record in session
                                    </p>
                                  </div>
                                )}

                                {order.status === 'paid' && order.paymentMethod && (
                                  <div className="pt-3 border-t border-slate-700/30 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-sm text-emerald-400 font-semibold">
                                      Paid via {order.paymentMethod.toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700/30">
            <p className="text-xs text-slate-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
              <span className="font-semibold text-slate-400">{filtered.length}</span> orders
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           bg-dark-700 border border-slate-700/40 text-slate-400
                           hover:bg-dark-600 hover:text-slate-200 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page number pills */}
              {Array.from({ length: totalPages }, (_, i) => i)
                .filter(i => i === 0 || i === totalPages - 1 || Math.abs(i - page) <= 1)
                .reduce((acc, i, idx, arr) => {
                  if (idx > 0 && i - arr[idx - 1] > 1) acc.push('…');
                  acc.push(i);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === '…' ? (
                    <span key={`ellipsis-${idx}`} className="w-8 text-center text-slate-600 text-xs">…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all
                        ${ item === page
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/40'
                          : 'bg-dark-700 border border-slate-700/40 text-slate-500 hover:text-slate-300 hover:bg-dark-600'
                        }`}
                    >
                      {item + 1}
                    </button>
                  )
                )
              }

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                           bg-dark-700 border border-slate-700/40 text-slate-400
                           hover:bg-dark-600 hover:text-slate-200 disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
