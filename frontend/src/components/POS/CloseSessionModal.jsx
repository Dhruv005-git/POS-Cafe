import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X, TrendingUp, AlertTriangle, CheckCircle2,
  Loader2, ShoppingBag, Banknote, CreditCard,
} from 'lucide-react';

function Row({ label, value, secondary, cls = 'text-slate-300' }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-700/30">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${cls}`}>₹{Number(value || 0).toFixed(2)}</span>
        {secondary != null && (
          <p className="text-xs text-slate-600">{secondary}</p>
        )}
      </div>
    </div>
  );
}

export default function CloseSessionModal({ session, onClose, onConfirm, closing }) {
  const [closingCash, setClosingCash] = useState('');

  const openingCash = session?.openingCash || 0;
  const cashSales   = session?.cashSales   || 0;
  const expectedCash = openingCash + cashSales;
  const actualCash   = parseFloat(closingCash) || 0;
  const difference   = actualCash - expectedCash;
  const isOver       = difference > 0;
  const isExact      = difference === 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(actualCash);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="w-full max-w-md overflow-hidden"
        style={{ background: '#0f172a', borderRadius: 24, border: '1px solid rgba(100,116,139,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-700/40 flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-slate-100 text-lg">Close Session</h2>
            <p className="text-xs text-slate-500 mt-0.5">End of shift cash reconciliation</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Session summary */}
        <div className="px-6 py-4 space-y-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Session Summary</p>
          <Row label="Opening Balance" value={openingCash} />
          <Row
            label={<span className="flex items-center gap-1.5"><Banknote className="w-3 h-3" /> Cash Sales</span>}
            value={cashSales}
            cls="text-emerald-400"
          />
          <Row
            label={<span className="flex items-center gap-1.5"><ShoppingBag className="w-3 h-3" /> Total Orders</span>}
            value={undefined}
            secondary={`${session?.totalOrders || 0} orders`}
          />
          {/* Expected = opening + cash sales */}
          <div className="flex items-center justify-between py-2.5 mt-1 rounded-xl px-3 bg-slate-800/60 border border-slate-700/30">
            <span className="text-sm font-semibold text-slate-300">Expected Cash in Drawer</span>
            <span className="text-base font-bold text-white">₹{expectedCash.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Actual cash count */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Count Your Cash Drawer
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</div>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-white text-xl font-bold tracking-wide
                           focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.25)' }}
                placeholder="0.00"
                value={closingCash}
                onChange={e => setClosingCash(e.target.value)}
              />
            </div>
          </div>

          {/* Live difference indicator */}
          {closingCash !== '' && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border
                ${isExact
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : isOver
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-red-500/10 border-red-500/30'}`}
            >
              {isExact
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                : <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${isOver ? 'text-blue-400' : 'text-red-400'}`} />
              }
              <div className="flex-1">
                <p className={`text-sm font-bold ${isExact ? 'text-emerald-400' : isOver ? 'text-blue-400' : 'text-red-400'}`}>
                  {isExact ? 'Perfect Balance! ✓'
                    : isOver
                      ? `Over by ₹${Math.abs(difference).toFixed(2)}`
                      : `Short by ₹${Math.abs(difference).toFixed(2)}`}
                </p>
                <p className="text-xs text-slate-500">
                  {isExact ? 'Cash matches exactly'
                    : isOver ? 'More cash than expected — check for double entries'
                    : 'Less cash than expected — check for missing payments'}
                </p>
              </div>
              <span className={`text-base font-black ${isExact ? 'text-emerald-400' : isOver ? 'text-blue-400' : 'text-red-400'}`}>
                {difference >= 0 ? '+' : ''}₹{Math.abs(difference).toFixed(2)}
              </span>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={closing || closingCash === ''}
            className="w-full py-3.5 rounded-2xl text-white font-bold flex items-center justify-center gap-2
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}
          >
            {closing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Closing...</>
              : 'Close Session & End Shift'}
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
