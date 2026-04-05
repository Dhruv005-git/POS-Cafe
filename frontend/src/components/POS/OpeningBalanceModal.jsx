import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Coffee, DollarSign, Lock, ArrowRight, Loader2 } from 'lucide-react';

/**
 * OpeningBalanceModal
 * Shows when a staff member starts a shift and there's no active session.
 * They enter the opening cash in the till and click "Open Session".
 */
export default function OpeningBalanceModal({ branchName, onOpen, opening }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    onOpen(val);
  };

  // Quick amount buttons
  const QUICK = [500, 1000, 2000, 5000];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-sm"
        style={{ background: '#0f172a', borderRadius: 24, border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}>
            <Coffee className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-1">Open POS Session</h2>
          <p className="text-slate-400 text-sm">
            {branchName
              ? <><span className="text-primary-400 font-medium">{branchName}</span> — Enter opening cash to start</>
              : 'Enter your opening cash amount to start'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {/* Cash input */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Opening Cash Balance
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-white text-xl font-bold tracking-wide
                           focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                style={{ background: '#1e293b', border: '1px solid rgba(99,102,241,0.25)' }}
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Quick amount buttons */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Quick amounts</p>
            <div className="grid grid-cols-4 gap-2">
              {QUICK.map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className={`py-2 rounded-xl text-sm font-semibold transition-all
                    ${String(q) === amount
                      ? 'bg-primary-500/30 text-primary-300 border border-primary-500/40'
                      : 'text-slate-400 border border-slate-700/50 hover:border-primary-500/30 hover:text-primary-400'}`}
                >
                  {q >= 1000 ? `${q/1000}k` : q}
                </button>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              This amount will be recorded and compared with your closing count.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={opening}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            {opening
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Opening Session...</>
              : <><ArrowRight className="w-5 h-5" /> Open Session & Start POS</>}
          </button>
        </form>
      </motion.div>
    </div>,
    document.body
  );
}
