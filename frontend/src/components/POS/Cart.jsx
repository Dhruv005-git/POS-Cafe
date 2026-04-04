import { AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChefHat, CreditCard, Trash2, CheckCircle } from 'lucide-react';
import CartItem from './CartItem.jsx';
import { notify } from '../../utils/toast.js'; 

export default function Cart({
  items, tableNumber, orderId, orderStatus,
  subtotal, tax, total,
  onIncrement, onDecrement, onRemove, onClear,
  onSendToKitchen, onPay, loading,
}) {
  const isSent = orderStatus === 'sent' || orderStatus === 'preparing';
  const hasItems = items.length > 0;
  const canPay = hasItems || (orderId && isSent);

  return (
    <div className="flex flex-col h-full bg-dark-800 border-l border-slate-700/50">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary-400" />
          <span className="font-display font-semibold text-slate-100">Order</span>
          {tableNumber && (
            <span className="badge-warning badge text-[10px]">Table {tableNumber}</span>
          )}
        </div>
        {hasItems && (
          <button onClick={onClear} className="text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Status banner — shown when order is in kitchen */}
      {isSent && !hasItems && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
          <ChefHat className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300 font-medium">
            Order is in the kitchen. Add more items or proceed to pay.
          </p>
        </div>
      )}

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4">
        {!hasItems && !isSent ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
            <div className="w-12 h-12 bg-dark-700 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-slate-500 text-sm">Cart is empty</p>
            <p className="text-slate-600 text-xs">Click products to add them here</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map(item => (
              <CartItem
                key={item._id}
                item={item}
                onIncrement={() => onIncrement(item._id)}
                onDecrement={() => onDecrement(item._id)}
                onRemove={() => onRemove(item._id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Totals + action buttons */}
      {(hasItems || canPay) && (
        <div className="px-4 pt-3 pb-4 border-t border-slate-700/50 flex-shrink-0 space-y-3">
          {hasItems && (
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax (5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-100 text-base pt-1 border-t border-slate-700/40">
                <span>Total</span>
                <span className="text-primary-400">${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {hasItems && (
              <button
                onClick={onSendToKitchen}
                disabled={loading}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <ChefHat className="w-4 h-4" />
                {isSent ? 'Update Kitchen Order' : 'Send to Kitchen'}
              </button>
            )}
            <button
                onClick={onPay}
                disabled={loading || !canPay}
                className="btn-accent w-full flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
                >
                {loading ? (
                    <span className="w-4 h-4 border-2 border-dark-900/40 border-t-dark-900 rounded-full animate-spin" />
                ) : (
                    <CreditCard className="w-4 h-4" />
                )}
                {hasItems ? `Pay $${total.toFixed(2)}` : 'Process Payment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}