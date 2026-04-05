// frontend/src/pages/CustomerOrderPage.jsx
// Mobile-first customer ordering: Splash → Branch → Menu → Cart → Confirm → Success → Track
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

const CATEGORIES = ['All', 'Food', 'Beverage', 'Dessert', 'Snack', 'Other'];
const STEPS = { SPLASH: 0, BRANCH: 1, MENU: 2, CART: 3, CONFIRM: 4, SUCCESS: 5, TRACK: 6 };

const slide = (dir = 1) => ({
  initial:    { x: dir * 60, opacity: 0 },
  animate:    { x: 0, opacity: 1 },
  exit:       { x: -dir * 60, opacity: 0 },
  transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
});

const fmt  = (n) => `₹${Number(n).toFixed(0)}`;
const TAX  = 0.05;

const cartSubtotal = (items) =>
  items.reduce((s, i) => {
    const extras = (i.selectedExtras || []).reduce((e, x) => e + x.price, 0);
    return s + (i.price + extras) * i.quantity;
  }, 0);

// ─── Screen 0: Splash ─────────────────────────────────────────────────────────
function SplashScreen({ storeName, onStart }) {
  return (
    <motion.div {...slide(1)}
      className="flex flex-col items-center justify-between min-h-screen px-6 py-16 text-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-primary-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-accent-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-500/30 to-accent-500/20
                     border border-primary-500/30 flex items-center justify-center shadow-2xl">
          <span className="text-6xl">☕</span>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
          <h1 className="font-display font-bold text-4xl text-slate-100 mb-2">{storeName}</h1>
          <p className="text-slate-500 text-sm">Scan · Order · Enjoy</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-2 mt-4">
          {['🍕 Fresh Pizzas', '🍔 Juicy Burgers', '☕ Artisan Coffee'].map((t, i) => (
            <span key={i} className="text-slate-600 text-sm">{t}</span>
          ))}
        </motion.div>
      </div>
      <motion.button initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65 }}
        whileTap={{ scale: 0.97 }} onClick={onStart}
        className="relative w-full max-w-xs py-4 rounded-2xl text-lg font-bold
                   bg-gradient-to-r from-primary-500 to-accent-500 text-white
                   shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 transition-shadow">
        Order Here
        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/70">→</span>
      </motion.button>
    </motion.div>
  );
}

// ─── Screen 1: Branch Select ──────────────────────────────────────────────────
function BranchSelectScreen({ branches, onSelect, onBack }) {
  return (
    <motion.div {...slide(1)} className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-700/40 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-dark-800 border border-slate-700/40
            flex items-center justify-center text-slate-400 font-bold text-lg">
          ←
        </button>
        <div>
          <h2 className="font-display font-bold text-slate-100">Choose Branch</h2>
          <p className="text-xs text-slate-500">Select the nearest location</p>
        </div>
      </div>

      {/* Branch list */}
      <div className="flex-1 px-4 py-5 space-y-3">
        {branches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">🏪</span>
            <p className="text-slate-500 text-sm">No branches found</p>
          </div>
        )}
        {branches.map((branch, idx) => (
          <motion.button
            key={branch._id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(branch)}
            className="w-full text-left px-5 py-4 rounded-2xl bg-dark-800
                       border border-slate-700/40 hover:border-primary-500/40
                       transition-all group flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-500/15 border border-primary-500/25
              flex items-center justify-center text-2xl flex-shrink-0">
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-100 group-hover:text-primary-300 transition-colors">
                {branch.name}
              </p>
              {branch.address && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {branch.address}</p>
              )}
              {branch.phone && (
                <p className="text-xs text-slate-600 mt-0.5">📞 {branch.phone}</p>
              )}
            </div>
            <span className="text-slate-600 group-hover:text-primary-400 transition-colors text-lg">→</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  const [bumped, setBumped] = useState(false);
  const handle = () => {
    onAdd(product);
    setBumped(true);
    setTimeout(() => setBumped(false), 300);
  };
  return (
    <motion.div whileTap={{ scale: 0.97 }}
      className="bg-dark-800 border border-slate-700/40 rounded-2xl p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <span className="text-3xl">{product.emoji}</span>
        {product.extras?.length > 0 && (
          <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5
            rounded-full border border-amber-500/20">✨ options</span>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-200 leading-tight">{product.name}</p>
        {product.description && (
          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{product.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="font-bold text-primary-400">{fmt(product.price)}</span>
        <motion.button whileTap={{ scale: 0.85 }}
          animate={bumped ? { scale: [1, 1.3, 1] } : {}} onClick={handle}
          className="w-8 h-8 rounded-xl bg-primary-500/20 border border-primary-500/30
            flex items-center justify-center text-primary-400 font-bold text-lg
            hover:bg-primary-500/30 transition-colors">+</motion.button>
      </div>
    </motion.div>
  );
}

// ─── Screen 2: Menu ──────────────────────────────────────────────────────────
function MenuScreen({ products, cart, branch, onAdd, onNext, onBack }) {
  const [cat, setCat]     = useState('All');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const mc = cat === 'All' || p.category === cat;
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartValue = cartSubtotal(cart);

  return (
    <motion.div {...slide(1)} className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 space-y-3 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="w-9 h-9 rounded-xl bg-dark-800 border border-slate-700/40
              flex items-center justify-center text-slate-400 font-bold text-lg flex-shrink-0">
            ←
          </button>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
            <input type="text" placeholder="Search menu..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-dark-800 border border-slate-700/40
                         text-sm text-slate-200 placeholder:text-slate-600
                         focus:outline-none focus:border-primary-500/50" />
          </div>
        </div>
        {branch && (
          <p className="text-xs text-primary-400/70 pl-1">🏪 {branch.name}</p>
        )}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all
                ${cat === c
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                  : 'text-slate-500 border-slate-700/40 hover:text-slate-300'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="text-4xl">🍽️</span>
            <p className="text-slate-500 text-sm">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => <ProductCard key={p._id} product={p} onAdd={onAdd} />)}
          </div>
        )}
      </div>

      {/* Cart bar */}
      {cartCount > 0 && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex-shrink-0 px-4 pb-6 pt-2">
          <button onClick={onNext}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500
              text-white font-bold text-base shadow-xl shadow-primary-500/30
              flex items-center justify-between px-5">
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">{cartCount} items</span>
            <span>View Cart</span>
            <span className="font-display text-lg">{fmt(cartValue * (1 + TAX))}</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Cart Item Row ────────────────────────────────────────────────────────────
function CartItemRow({ item, onIncrement, onDecrement, onNoteChange, onExtraToggle }) {
  const [showExtras, setShowExtras] = useState(false);
  const extras = (item.selectedExtras || []).reduce((s, e) => s + e.price, 0);
  const lineTotal = (item.price + extras) * item.quantity;

  return (
    <div className="border-b border-slate-700/30 last:border-0 py-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">{item.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
          {item.selectedExtras?.length > 0 && (
            <p className="text-[11px] text-amber-400/80 mt-0.5">
              ✨ {item.selectedExtras.map(e => e.name).join(', ')}
            </p>
          )}
          {item.notes && <p className="text-[11px] text-slate-500 mt-0.5">📝 {item.notes}</p>}
          {item.availableExtras?.length > 0 && (
            <button onClick={() => setShowExtras(v => !v)}
              className="text-[11px] text-primary-400 mt-1 hover:text-primary-300">
              {showExtras ? '▲ Hide options' : '✨ Customise'}
            </button>
          )}
          <AnimatePresence>
            {showExtras && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                <div className="flex flex-wrap gap-1.5">
                  {item.availableExtras.map(extra => {
                    const sel = item.selectedExtras?.some(e => e.name === extra.name);
                    return (
                      <button key={extra.name} onClick={() => onExtraToggle(item._id, extra, sel)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all
                          ${sel
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/40'
                            : 'bg-dark-700 text-slate-400 border-slate-700/40 hover:border-amber-500/30'}`}>
                        {sel ? '✓ ' : '+ '}{extra.name} {fmt(extra.price)}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-sm font-bold text-slate-200">{fmt(lineTotal)}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onDecrement(item._id)}
              className="w-7 h-7 rounded-lg bg-dark-700 flex items-center justify-center
                         text-slate-400 hover:text-slate-200 font-bold text-base transition-colors">
              {item.quantity === 1 ? '🗑' : '−'}
            </button>
            <span className="w-6 text-center font-bold text-slate-100 text-sm">{item.quantity}</span>
            <button onClick={() => onIncrement(item._id)}
              className="w-7 h-7 rounded-lg bg-primary-500/20 flex items-center justify-center
                         text-primary-400 font-bold text-base hover:bg-primary-500/30 transition-colors">+</button>
          </div>
        </div>
      </div>
      <input type="text" placeholder="Add note (e.g. no onions)..." value={item.notes || ''}
        onChange={e => onNoteChange(item._id, e.target.value)}
        className="w-full mt-2 ml-9 text-[11px] bg-transparent border-b border-slate-700/30
                   text-slate-400 placeholder:text-slate-600 focus:outline-none
                   focus:border-amber-400/30 pb-0.5 transition-colors"
        style={{ width: 'calc(100% - 36px)' }} />
    </div>
  );
}

// ─── Screen 3: Cart ──────────────────────────────────────────────────────────
function CartScreen({ cart, onIncrement, onDecrement, onNoteChange, onExtraToggle, onNext, onBack }) {
  const sub   = cartSubtotal(cart);
  const tax   = sub * TAX;
  const total = sub + tax;

  if (cart.length === 0) return (
    <motion.div {...slide(1)} className="flex flex-col items-center justify-center
      min-h-screen gap-4 p-8">
      <span className="text-6xl">🛒</span>
      <p className="text-slate-500 text-lg font-semibold">Your cart is empty</p>
      <button onClick={onBack}
        className="mt-4 px-6 py-3 rounded-2xl bg-primary-500/20 text-primary-400
          border border-primary-500/30 font-semibold">← Back to Menu</button>
    </motion.div>
  );

  return (
    <motion.div {...slide(1)} className="flex flex-col h-screen">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-700/40 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-dark-800 border border-slate-700/40
            flex items-center justify-center text-slate-400 font-bold text-lg">←</button>
        <div>
          <h2 className="font-display font-bold text-slate-100">Your Cart</h2>
          <p className="text-xs text-slate-500">{cart.reduce((s,i)=>s+i.quantity,0)} items</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2">
        {cart.map(item => (
          <CartItemRow key={item._id} item={item}
            onIncrement={onIncrement} onDecrement={onDecrement}
            onNoteChange={onNoteChange} onExtraToggle={onExtraToggle} />
        ))}
      </div>
      <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-slate-700/40 space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span><span>{fmt(sub)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tax (5%)</span><span>{fmt(tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-100 text-base pt-1 border-t border-slate-700/30">
            <span>Total</span><span className="text-primary-400">{fmt(total)}</span>
          </div>
        </div>
        <button onClick={onNext}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500
            text-white font-bold text-base shadow-xl shadow-primary-500/25
            flex items-center justify-between px-5">
          <span>Continue</span><span>{fmt(total)} →</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Screen 4: Confirm ────────────────────────────────────────────────────────
function ConfirmScreen({ cart, branch, tableNumber, onConfirm, onBack, placing }) {
  const [name, setName] = useState('');
  const sub   = cartSubtotal(cart);
  const total = sub * (1 + TAX);

  return (
    <motion.div {...slide(1)} className="flex flex-col h-screen">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-700/40 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-dark-800 border border-slate-700/40
            flex items-center justify-center text-slate-400 font-bold text-lg">←</button>
        <h2 className="font-display font-bold text-slate-100">Confirm Order</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Branch + table */}
        {(branch || tableNumber) && (
          <div className="flex gap-3">
            {branch && (
              <div className="flex-1 flex items-center gap-2 px-3 py-3 rounded-xl
                bg-primary-500/10 border border-primary-500/25">
                <span>🏪</span>
                <div>
                  <p className="text-[10px] text-slate-500">Branch</p>
                  <p className="text-sm font-bold text-primary-300">{branch.name}</p>
                </div>
              </div>
            )}
            {tableNumber && (
              <div className="flex items-center gap-2 px-3 py-3 rounded-xl
                bg-primary-500/10 border border-primary-500/25">
                <span>🪑</span>
                <div>
                  <p className="text-[10px] text-slate-500">Table</p>
                  <p className="text-sm font-bold text-primary-300">#{tableNumber}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order summary */}
        <div className="bg-dark-800 rounded-2xl border border-slate-700/40 divide-y divide-slate-700/30">
          {cart.map(item => {
            const extras = (item.selectedExtras||[]).reduce((s,e)=>s+e.price,0);
            return (
              <div key={item._id} className="px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.emoji} {item.quantity} × {item.name}</span>
                  <span className="font-semibold text-slate-200">{fmt((item.price + extras) * item.quantity)}</span>
                </div>
                {item.selectedExtras?.length > 0 && (
                  <p className="text-[11px] text-amber-400/70 mt-0.5 ml-5">
                    ✨ {item.selectedExtras.map(e=>`${e.name} +₹${e.price}`).join(', ')}
                  </p>
                )}
                {item.notes && <p className="text-[11px] text-slate-500 mt-0.5 ml-5">📝 {item.notes}</p>}
              </div>
            );
          })}
          <div className="px-4 py-3 flex justify-between font-bold text-base">
            <span className="text-slate-400">Total (incl. 5% tax)</span>
            <span className="text-primary-400">{fmt(total)}</span>
          </div>
        </div>

        {/* Payment note */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <span className="text-xl">💳</span>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Payment is collected at the counter after your order is ready.
            You may pay by <strong>Cash, Card, or UPI</strong>.
          </p>
        </div>

        {/* Optional name */}
        <div>
          <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Your Name (optional)
          </label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riya"
            className="w-full mt-1.5 px-4 py-3 rounded-xl bg-dark-800 border border-slate-700/40
                       text-sm text-slate-200 placeholder:text-slate-600
                       focus:outline-none focus:border-primary-500/40 transition-colors" />
        </div>
      </div>
      <div className="flex-shrink-0 px-4 pb-6 pt-3">
        <button onClick={() => onConfirm(name)} disabled={placing}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500
            text-white font-bold text-base shadow-xl shadow-primary-500/25
            disabled:opacity-60 flex items-center justify-center gap-2">
          {placing
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Placing...</>
            : '✓ Place Order'}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Screen 5: Success ────────────────────────────────────────────────────────
function SuccessScreen({ orderNumber, total, onTrack }) {
  return (
    <motion.div {...slide(1)} className="flex flex-col items-center justify-between
      min-h-screen px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80
          bg-emerald-500/10 rounded-full blur-3xl" />
      </div>
      <div />
      <div className="relative flex flex-col items-center gap-6 text-center">
        <motion.div initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 15 }}
          className="w-28 h-28 rounded-full bg-emerald-500/20 border-4 border-emerald-500/40
                     flex items-center justify-center">
          <span className="text-5xl">✅</span>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
          <p className="font-display font-bold text-5xl text-slate-100 mb-1">{orderNumber}</p>
          <p className="text-emerald-400 font-semibold text-lg">Order Confirmed!</p>
          <p className="text-slate-500 text-sm mt-1">Total: {fmt(total)}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300/80 text-sm text-center">
          💳 Pay <strong>{fmt(total)}</strong> at the counter after your order is ready
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="text-slate-600 text-sm">
          Your order is being sent to the kitchen 🍳
        </motion.p>
      </div>
      <motion.button initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }} onClick={onTrack} whileTap={{ scale: 0.97 }}
        className="w-full max-w-xs py-4 rounded-2xl border-2 border-primary-500/50
                   text-primary-400 font-bold text-base hover:bg-primary-500/10 transition-colors">
        Track My Order →
      </motion.button>
    </motion.div>
  );
}

// ─── Screen 6: Track ──────────────────────────────────────────────────────────
const STATUS_META = {
  draft:     { label: 'Order Received',   color: 'text-slate-400',  bg: 'bg-slate-500/20',  icon: '📋', step: 0 },
  sent:      { label: 'Sent to Kitchen',  color: 'text-amber-400',  bg: 'bg-amber-500/20',  icon: '🍳', step: 1 },
  preparing: { label: 'Preparing Now',    color: 'text-amber-400',  bg: 'bg-amber-500/20',  icon: '👨‍🍳', step: 2 },
  ready:     { label: '🎉 Order Ready!',  color: 'text-emerald-400',bg: 'bg-emerald-500/20',icon: '✅', step: 3 },
  paid:      { label: 'Completed',        color: 'text-primary-400',bg: 'bg-primary-500/20',icon: '🎊', step: 4 },
};

const ITEM_STATUS = {
  pending:   { label: 'Pending',   color: 'text-slate-400',  bg: 'bg-slate-500/15'   },
  preparing: { label: 'Preparing', color: 'text-amber-400',  bg: 'bg-amber-500/15'   },
  ready:     { label: 'Ready',     color: 'text-emerald-400',bg: 'bg-emerald-500/15'  },
};

function TrackScreen({ orderId, orderTotal, onBack, onNewOrder }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/menu/orders/${orderId}`);
      setOrder(data.order);
    } catch {
      setError('Could not load order status');
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchOrder]);

  const meta    = order ? (STATUS_META[order.status] || STATUS_META.sent) : null;
  const isReady = order?.status === 'ready';
  const isPaid  = order?.status === 'paid';
  const steps   = ['Received', 'In Kitchen', 'Preparing', 'Ready'];

  return (
    <motion.div {...slide(1)} className="flex flex-col h-screen">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-700/40 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-dark-800 border border-slate-700/40
            flex items-center justify-center text-slate-400 font-bold text-lg">←</button>
        <div>
          <h2 className="font-display font-bold text-slate-100">Live Tracking</h2>
          <p className="text-xs text-slate-500">Refreshes every 5 seconds</p>
        </div>
        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">{error}</div>
        )}
        {!order && !error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-primary-500/40 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm">Loading...</p>
          </div>
        )}

        {order && (
          <>
            {/* Status card */}
            <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border
              ${meta.bg} border-slate-700/30`}>
              <span className="text-4xl">{meta.icon}</span>
              <div>
                <p className="text-xs text-slate-500">Order</p>
                <p className="font-display font-bold text-2xl text-slate-100">{order.orderNumber}</p>
                <p className={`text-base font-semibold mt-0.5 ${meta.color}`}>{meta.label}</p>
              </div>
            </div>

            {/* Progress bar */}
            {!isPaid && (
              <div className="flex items-center gap-0">
                {steps.map((s, i) => {
                  const done = i <= (meta?.step ?? 0);
                  return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1">
                      <div className={`w-5 h-5 rounded-full border-2 transition-all ${done
                        ? 'bg-primary-500 border-primary-500' : 'bg-dark-800 border-slate-700'}`} />
                      {i < steps.length - 1 && (
                        <div className="absolute" style={{ display: 'none' }} />
                      )}
                      <span className={`text-[9px] font-semibold text-center leading-tight
                        ${done ? 'text-primary-400' : 'text-slate-600'}`}>{s}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Payment banner — shows when ready */}
            {isReady && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="px-4 py-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 space-y-2">
                <p className="font-bold text-emerald-400 text-base">🎉 Your order is ready!</p>
                <div className="h-px bg-emerald-500/20" />
                <p className="text-sm text-slate-300">
                  Please pay <span className="font-bold text-emerald-300">{fmt(order.total)}</span> at the counter.
                </p>
                <p className="text-xs text-slate-500">Accepted: Cash · Card · UPI</p>
              </motion.div>
            )}

            {/* Item list */}
            <div className="bg-dark-800 rounded-2xl border border-slate-700/40 overflow-hidden">
              <p className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500
                border-b border-slate-700/30">Your Items</p>
              {order.items.map((item, idx) => {
                const im = ITEM_STATUS[item.status] || ITEM_STATUS.pending;
                return (
                  <div key={idx} className="flex items-center gap-3 px-4 py-3
                    border-b border-slate-700/20 last:border-0">
                    <span className="text-xl">{item.product?.emoji || item.emoji || '🍽️'}</span>
                    <p className="flex-1 text-sm text-slate-200 font-medium">
                      {item.quantity} × {item.name}
                    </p>
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${im.bg} ${im.color}`}>
                      {im.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between px-4 py-3 bg-dark-800 rounded-2xl border border-slate-700/40">
              <span className="text-slate-400">Total Payable</span>
              <span className="font-bold text-primary-400">{fmt(order.total)}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex-shrink-0 px-4 pb-6 pt-2">
        <button onClick={onNewOrder}
          className="w-full py-3 rounded-2xl border border-slate-700/40 text-slate-400
            font-semibold hover:bg-dark-800 transition-colors text-sm">
          ← Order Again
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CustomerOrderPage() {
  const [step, setStep]         = useState(STEPS.SPLASH);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch]     = useState(null);
  const [storeName, setStoreName] = useState('POS Cafe');
  const [cart, setCart]         = useState([]);
  const [orderId, setOrderId]   = useState(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderTotal, setOrderTotal]   = useState(0);
  const [placing, setPlacing]   = useState(false);

  const params      = new URLSearchParams(window.location.search);
  const tableId     = params.get('tableId')  || null;
  const tableNumber = params.get('table')    || null;
  const branchParam = params.get('branchId') || null;

  useEffect(() => {
    api.get('/menu/info').then(({ data }) => setStoreName(data.storeName)).catch(() => {});
    api.get('/menu/products').then(({ data }) => setProducts(data.products)).catch(() => {});
    api.get('/menu/branches').then(({ data }) => {
      setBranches(data.branches || []);
      // If branchId is in the URL, auto-select that branch
      if (branchParam) {
        const found = (data.branches || []).find(b => b._id === branchParam);
        if (found) setBranch(found);
      }
    }).catch(() => {});

    // Re-fetch products when user returns to tab (admin may have updated extras)
    const onVisible = () => {
      if (document.visibilityState === 'visible')
        api.get('/menu/products').then(({ data }) => setProducts(data.products)).catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // Cart actions
  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        _id: product._id, name: product.name, price: product.price,
        emoji: product.emoji, quantity: 1, notes: '',
        selectedExtras: [], availableExtras: product.extras || [],
      }];
    });
  }, []);

  const increment = useCallback((id) =>
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: i.quantity + 1 } : i)), []);

  const decrement = useCallback((id) =>
    setCart(prev => {
      const item = prev.find(i => i._id === id);
      if (!item) return prev;
      if (item.quantity <= 1) return prev.filter(i => i._id !== id);
      return prev.map(i => i._id === id ? { ...i, quantity: i.quantity - 1 } : i);
    }), []);

  const setNote = useCallback((id, notes) =>
    setCart(prev => prev.map(i => i._id === id ? { ...i, notes } : i)), []);

  const toggleExtra = useCallback((id, extra, isSelected) => {
    setCart(prev => prev.map(i => {
      if (i._id !== id) return i;
      const updated = isSelected
        ? (i.selectedExtras || []).filter(e => e.name !== extra.name)
        : [{ name: extra.name, price: extra.price }]; // radio: replace all
      return { ...i, selectedExtras: updated };
    }));
  }, []);

  const placeOrder = async (customerName) => {
    setPlacing(true);
    try {
      const { data } = await api.post('/menu/orders', {
        tableId, tableNumber: tableNumber ? Number(tableNumber) : null,
        branchId: branch?._id || null,
        customerName,
        items: cart.map(i => ({
          productId: i._id, name: i.name, price: i.price,
          quantity: i.quantity, emoji: i.emoji, notes: i.notes,
          selectedExtras: i.selectedExtras || [],
        })),
      });
      setOrderId(data.order._id);
      setOrderNumber(data.order.orderNumber);
      setOrderTotal(data.order.total);
      setCart([]);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const reset = () => {
    setCart([]); setOrderId(null); setOrderNumber('');
    setBranch(null); setStep(STEPS.SPLASH);
  };

  // If branchId is already known (from QR code), skip branch selection
  const handleOrderHere = () => {
    if (branchParam && branch) {
      setStep(STEPS.MENU); // skip branch selection
    } else if (branches.length <= 1) {
      if (branches.length === 1) setBranch(branches[0]);
      setStep(STEPS.MENU); // single branch — skip selection
    } else {
      setStep(STEPS.BRANCH);
    }
  };

  const handleBranchSelect = (b) => {
    setBranch(b);
    setStep(STEPS.MENU);
  };

  return (
    <div className="min-h-screen bg-dark-900" style={{ maxWidth: 480, margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {step === STEPS.SPLASH && (
          <SplashScreen key="splash" storeName={storeName} onStart={handleOrderHere} />
        )}
        {step === STEPS.BRANCH && (
          <BranchSelectScreen key="branch" branches={branches}
            onSelect={handleBranchSelect} onBack={() => setStep(STEPS.SPLASH)} />
        )}
        {step === STEPS.MENU && (
          <MenuScreen key="menu" products={products} cart={cart} branch={branch}
            onAdd={addToCart} onNext={() => setStep(STEPS.CART)} onBack={() => setStep(STEPS.BRANCH)} />
        )}
        {step === STEPS.CART && (
          <CartScreen key="cart" cart={cart}
            onIncrement={increment} onDecrement={decrement}
            onNoteChange={setNote} onExtraToggle={toggleExtra}
            onNext={() => setStep(STEPS.CONFIRM)} onBack={() => setStep(STEPS.MENU)} />
        )}
        {step === STEPS.CONFIRM && (
          <ConfirmScreen key="confirm" cart={cart} branch={branch} tableNumber={tableNumber}
            onConfirm={placeOrder} onBack={() => setStep(STEPS.CART)} placing={placing} />
        )}
        {step === STEPS.SUCCESS && (
          <SuccessScreen key="success" orderNumber={orderNumber} total={orderTotal}
            onTrack={() => setStep(STEPS.TRACK)} />
        )}
        {step === STEPS.TRACK && (
          <TrackScreen key="track" orderId={orderId} orderTotal={orderTotal}
            onBack={() => setStep(STEPS.SUCCESS)} onNewOrder={reset} />
        )}
      </AnimatePresence>
    </div>
  );
}
