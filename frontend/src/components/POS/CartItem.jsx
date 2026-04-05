import { useState } from 'react';
import { Minus, Plus, Trash2, ChevronDown, StickyNote, Tag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartItem({ item, onIncrement, onDecrement, onRemove, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  // Local edit state — initialise from item
  const [notes, setNotes]         = useState(item.notes || '');
  const [priceStr, setPriceStr]   = useState('');      // override price string
  const [discountStr, setDiscStr] = useState('');      // discount %

  // Effective price after override / discount / extras
  const basePrice    = item.priceOverride != null ? item.priceOverride : item.price;
  const discountFrac = (item.discount || 0) / 100;
  const effectiveBase = basePrice * (1 - discountFrac);
  const extrasTotal   = (item.selectedExtras || []).reduce((s, e) => s + e.price, 0);
  const effectivePrice = effectiveBase; // per-unit base price (display)
  const lineTotal = (effectiveBase + extrasTotal) * item.quantity;

  const commit = () => {
    const po = priceStr !== '' ? parseFloat(priceStr) : undefined;
    const disc = discountStr !== '' ? parseFloat(discountStr) : undefined;
    onEdit?.(item._id, {
      notes,
      priceOverride: po != null && !isNaN(po) ? po : item.priceOverride,
      discount:      disc != null && !isNaN(disc) ? Math.min(disc, 100) : item.discount,
    });
    setExpanded(false);
  };

  const handleNoteBlur = () => {
    onEdit?.(item._id, { notes });
  };

  const toggleExtra = (extra) => {
    const current = item.selectedExtras || [];
    const isSelected = current.some(e => e.name === extra.name);
    const updated = isSelected
      ? current.filter(e => e.name !== extra.name)
      : [...current, { name: extra.name, price: extra.price }];
    onEdit?.(item._id, { selectedExtras: updated });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="border-b border-slate-700/40 last:border-0"
    >
      {/* ── Main row ──────────────────────────────────────────── */}
      <div className="flex items-start gap-3 py-3">
        <span className="text-xl mt-0.5 select-none">{item.emoji}</span>

        {/* Name + notes summary — clicking opens editor */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 min-w-0 text-left group"
        >
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-slate-200 truncate">{item.name}</p>
            <ChevronDown
              className={`w-3 h-3 text-slate-500 flex-shrink-0 transition-transform duration-200
                ${expanded ? 'rotate-180' : ''}`}
            />
          </div>
          {/* Price line */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {item.discount > 0 && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-full font-semibold">
                -{item.discount}%
              </span>
            )}
            {item.priceOverride != null && item.priceOverride !== item.price && (
              <span className="text-[10px] text-slate-600 line-through">₹{item.price.toFixed(2)}</span>
            )}
            <span className="text-xs text-slate-500">₹{effectivePrice.toFixed(2)} each</span>
            {item.selectedExtras?.length > 0 && (
              <span className="text-[10px] text-amber-400/80 font-medium">
                ✨ +{item.selectedExtras.length} extra{item.selectedExtras.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {/* Notes preview */}
          {item.notes && (
            <p className="text-[11px] text-amber-400/80 mt-0.5 truncate">
              📝 {item.notes}
            </p>
          )}
        </button>

        {/* Qty controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
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

        {/* Line total */}
        <div className="text-right flex-shrink-0 w-14">
          <span className="text-sm font-semibold text-slate-200">₹{lineTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* ── Expanded editor panel ──────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-2.5 pl-9 pr-1">

              {/* ── Extras Selector ─────────────────────────────── */}
              {item.availableExtras?.length > 0 && (
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-amber-400">Extras</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {item.availableExtras.map(extra => {
                      const isSelected = item.selectedExtras?.some(e => e.name === extra.name);
                      return (
                        <button
                          key={extra.name}
                          type="button"
                          onClick={() => toggleExtra(extra)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all border ${
                            isSelected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-dark-700 text-slate-400 border-slate-700/40 hover:border-amber-500/30 hover:text-amber-400'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{extra.name}
                          <span className="ml-1 opacity-70">+₹{extra.price}</span>
                        </button>
                      );
                    })}
                  </div>
                  {item.selectedExtras?.length > 0 && (
                    <p className="text-[10px] text-amber-400/70 mt-1.5">
                      Extras total: +₹{extrasTotal} per item
                      · Line cost: ₹{lineTotal.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  <StickyNote className="w-3 h-3" /> Special Instructions
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  onBlur={handleNoteBlur}
                  placeholder="e.g. Less sugar, no ice, extra spicy..."
                  rows={2}
                  className="w-full bg-slate-800/80 border border-slate-700/40 rounded-xl px-3 py-2
                             text-xs text-slate-200 placeholder:text-slate-600 resize-none
                             focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {/* Price override */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    ₹ Price Override
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder={item.price.toFixed(2)}
                      value={priceStr}
                      onChange={e => setPriceStr(e.target.value)}
                      className="w-full pl-6 pr-2 py-2 rounded-xl bg-slate-800/80 border border-slate-700/40
                                 text-xs text-slate-200 placeholder:text-slate-600
                                 focus:outline-none focus:border-primary-500/40 transition-colors"
                    />
                  </div>
                </div>

                {/* Discount % */}
                <div>
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    <Tag className="w-3 h-3" /> Discount %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder={item.discount ? String(item.discount) : '0'}
                      value={discountStr}
                      onChange={e => setDiscStr(e.target.value)}
                      className="w-full pl-3 pr-6 py-2 rounded-xl bg-slate-800/80 border border-slate-700/40
                                 text-xs text-slate-200 placeholder:text-slate-600
                                 focus:outline-none focus:border-emerald-500/40 transition-colors"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
                  </div>

                  {/* Quick discount buttons */}
                  <div className="flex gap-1 mt-1.5">
                    {[5, 10, 15, 20].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDiscStr(String(d))}
                        className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all
                          ${String(d) === discountStr
                            ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/40'
                            : 'text-slate-500 border border-slate-700/40 hover:border-emerald-500/30 hover:text-emerald-400'}`}
                      >
                        {d}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Apply/Cancel */}
              <div className="flex gap-2">
                <button
                  onClick={() => setExpanded(false)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-slate-500
                             border border-slate-700/40 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={commit}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold
                             bg-primary-500/20 text-primary-400 border border-primary-500/30
                             hover:bg-primary-500/30 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}