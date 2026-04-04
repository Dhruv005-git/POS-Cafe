import { useState, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, TableProperties, Loader2,
  User, X, Search, UserPlus, Check,
} from 'lucide-react';
import ProductGrid from '../components/POS/ProductGrid.jsx';
import Cart from '../components/POS/Cart.jsx';
import PaymentModal from '../components/POS/PaymentModal.jsx';
import { useOrder } from '../hooks/useOrder.js';
import PageTransition from '../components/PageTransition.jsx';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

// ── Customer Assign Modal ─────────────────────────────────────────────────────
function CustomerAssignModal({ onAssign, onSkip, onClose }) {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      // Search among existing customer users
      const { data } = await api.get('/customers');
      const filtered = data.customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
      setCustomers(filtered);
      setSearched(true);
    } catch {
      toast.error('Could not search customers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-400" />
            </div>
            <h2 className="font-display font-bold text-slate-100">Assign Customer</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Link this order to a customer account for tracking, or skip to proceed without linking.
        </p>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              className="input pl-9 py-2 text-sm"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
          </div>
          <button onClick={handleSearch} disabled={loading}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Search className="w-4 h-4" />
            }
            Search
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="max-h-52 overflow-y-auto space-y-1.5 mb-4">
            {customers.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-4">No customers found</p>
            ) : (
              customers.map(c => (
                <button key={c._id}
                  onClick={() => onAssign(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-dark-700 border border-slate-700/40 hover:border-primary-500/40
                             hover:bg-primary-500/10 transition-all duration-150 text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center
                                  justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.email}</p>
                  </div>
                  <Check className="w-4 h-4 text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-slate-700/40 mt-2">
          <button onClick={onSkip}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400
                       border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
            Skip — No customer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main OrderScreen ──────────────────────────────────────────────────────────
export default function OrderScreen() {
  const { tableId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const table = state?.table;

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [assignedCustomer, setAssignedCustomer] = useState(null);

  const {
    cartItems,
    orderId,
    orderStatus,
    loadingOrder,
    actionLoading,
    subtotal,
    tax,
    total,
    addToCart,
    increment,
    decrement,
    remove,
    clearCart,
    sendToKitchen,
  } = useOrder(table, assignedCustomer?._id);

  const handleSendToKitchen = async () => {
    // If no customer assigned yet, prompt to assign first
    if (!assignedCustomer && !orderId) {
      setCustomerModal(true);
      return;
    }
    const ok = await sendToKitchen();
    if (ok) {
      navigate('/pos/floor');
    }
  };

  const handleCustomerAssigned = (customer) => {
    setAssignedCustomer(customer);
    setCustomerModal(false);
    toast.success(`Customer "${customer.name}" linked to order`);
  };

  const handleCustomerSkipped = () => {
    setCustomerModal(false);
    // Proceed to send without customer
    sendToKitchen().then(ok => { if (ok) navigate('/pos/floor'); });
  };

  const handleOpenPayment = () => {
    if (cartItems.length === 0 && !orderId) return;
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    navigate('/pos/floor');
  };

  if (loadingOrder) {
    return (
      <div className="h-[calc(100vh-57px)] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading order...</span>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="h-[calc(100vh-57px)] flex">

        {/* LEFT — Product grid */}
        <div className="flex-1 overflow-hidden flex flex-col border-r border-slate-700/50">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center gap-3 flex-shrink-0 bg-dark-800">
            <button
              onClick={() => navigate('/pos/floor')}
              className="btn-secondary p-2 flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <TableProperties className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-200">
              {table ? `Table ${table.number} — ${table.floor}` : 'New Order'}
            </span>
            {table && <span className="text-xs text-slate-500">{table.seats} seats</span>}

            {/* Customer badge */}
            {assignedCustomer && (
              <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                             bg-primary-500/10 border border-primary-500/25 text-primary-400 text-xs font-medium">
                <User className="w-3 h-3" />
                {assignedCustomer.name}
                <button onClick={() => setAssignedCustomer(null)}
                  className="ml-0.5 hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {!assignedCustomer && (
              <button
                onClick={() => setCustomerModal(true)}
                className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                           border border-slate-700/40 text-slate-500 hover:text-slate-300
                           hover:border-slate-600 text-xs transition-all duration-150"
              >
                <UserPlus className="w-3 h-3" />
                Assign Customer
              </button>
            )}

            {orderId && (
              <span className="badge-warning badge text-[10px]">
                {orderStatus === 'sent' || orderStatus === 'preparing' ? '🍳 In Kitchen' : '📝 Draft'}
              </span>
            )}
          </div>

          <ProductGrid onAddToCart={addToCart} />
        </div>

        {/* RIGHT — Cart */}
        <div className="w-72 xl:w-80 flex-shrink-0">
          <Cart
            items={cartItems}
            tableNumber={table?.number}
            orderId={orderId}
            orderStatus={orderStatus}
            subtotal={subtotal}
            tax={tax}
            total={total}
            onIncrement={increment}
            onDecrement={decrement}
            onRemove={remove}
            onClear={clearCart}
            onSendToKitchen={handleSendToKitchen}
            onPay={handleOpenPayment}
            loading={actionLoading}
          />
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          orderId={orderId}
          cartItems={cartItems}
          total={total}
          tableNumber={table?.number}
        />

        {/* Customer Assign Modal */}
        <AnimatePresence>
          {customerModal && (
            <CustomerAssignModal
              onAssign={handleCustomerAssigned}
              onSkip={handleCustomerSkipped}
              onClose={() => setCustomerModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}