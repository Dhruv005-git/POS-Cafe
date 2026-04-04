import { Minus, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CartItem({ item, onIncrement, onDecrement, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-start gap-3 py-3 border-b border-slate-700/40 last:border-0"
    >
      <span className="text-xl mt-0.5 select-none">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
        <p className="text-xs text-slate-500">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={onDecrement}
          className="w-6 h-6 rounded-md bg-dark-700 hover:bg-dark-700/70 flex items-center justify-center transition-colors"
        >
          {item.quantity === 1
            ? <Trash2 className="w-3 h-3 text-red-400" />
            : <Minus className="w-3 h-3 text-slate-400" />}
        </button>
        <span className="w-6 text-center font-bold text-sm text-slate-100">{item.quantity}</span>
        <button
          onClick={onIncrement}
          className="w-6 h-6 rounded-md bg-primary-500/20 hover:bg-primary-500/40 flex items-center justify-center transition-colors"
        >
          <Plus className="w-3 h-3 text-primary-400" />
        </button>
      </div>
      <div className="text-right flex-shrink-0 w-14">
        <span className="text-sm font-semibold text-slate-200">
          ${(item.price * item.quantity).toFixed(2)}
        </span>
      </div>
    </motion.div>
  );
}