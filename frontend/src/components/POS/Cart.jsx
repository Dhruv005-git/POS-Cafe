import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShoppingCart, ChefHat, CreditCard, Trash2,
  User, UserPlus, Search, X, Check, Plus, Loader2, Delete, Sparkles,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

// ── Inline Customer Picker ────────────────────────────────────────────────────
function CustomerPicker({ onSelect, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('list');
  const [newForm, setNewForm] = useState({ name: '', email: '', password: 'welcome123' });
  const [creating, setCreating] = useState(false);

  useState(() => {
    api.get('/customers')
      .then(({ data }) => setCustomers(data.customers || []))
      .catch(() => toast.error('Could not load customers'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.email.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/auth/signup', { ...newForm, role: 'customer' });
      toast.success(`✅ "${data.user.name}" created!`);
      onSelect(data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally { setCreating(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18 }}
      className="overflow-hidden border-t border-slate-700/40"
    >
      <div className="bg-slate-900/60">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <div className="flex gap-1">
            {['list','new'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all
                  ${mode===m ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                             : 'text-slate-500 hover:text-slate-300'}`}>
                {m === 'list' ? '👥 Customers' : '+ New'}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {mode === 'list' ? (
          <>
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input autoFocus
                  className="w-full bg-slate-800/80 border border-slate-700/40 rounded-xl pl-8 pr-3 py-2
                             text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50"
                  placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto px-2 pb-3 space-y-0.5">
              {loading
                ? <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 text-slate-600 animate-spin"/></div>
                : filtered.length === 0
                  ? <p className="text-center text-slate-600 text-xs py-4">No customers found</p>
                  : filtered.map(c => (
                    <button key={c._id} onClick={() => onSelect(c)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-primary-500/10 text-left transition-all">
                      <div className="w-7 h-7 rounded-full bg-primary-500/20 flex items-center justify-center text-xs font-bold text-primary-300">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{c.email}</p>
                      </div>
                    </button>
                  ))}
            </div>
          </>
        ) : (
          <form onSubmit={handleCreate} className="px-3 pb-3 space-y-2">
            {['name','email','password'].map(f => (
              <input key={f} autoFocus={f==='name'} type={f==='email'?'email':f==='password'?'password':'text'}
                placeholder={f.charAt(0).toUpperCase()+f.slice(1)+(f==='name'||f==='email'?' *':'')}
                value={newForm[f]} onChange={e => setNewForm(p=>({...p,[f]:e.target.value}))} required={f!=='password'}
                className="w-full bg-slate-800/80 border border-slate-700/40 rounded-xl px-3 py-2 text-sm text-slate-200
                           placeholder:text-slate-600 focus:outline-none focus:border-primary-500/50" />
            ))}
            <button type="submit" disabled={creating}
              className="w-full py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400
                         border border-emerald-500/30 hover:bg-emerald-500/25 flex items-center justify-center gap-1.5">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <UserPlus className="w-3.5 h-3.5"/>}
              {creating ? 'Creating...' : 'Create & Assign'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

// ── Numpad ───────────────────────────────────────────────────────────────────
const MODES = ['Qty', 'Prices', 'Disc.'];

function Numpad({ mode, setMode, input, onDigit, onBackspace, onClear, onPlusMinus }) {
  const digits = ['1','2','3','4','5','6','7','8','9','0'];
  return (
    <div className="px-2 pt-1 pb-2">
      <div className="grid grid-cols-4 gap-1.5">
        {/* Rows 1-4: digit + mode button */}
        {[0,1,2,3].map(row => {
          const d1 = digits[row*2];
          const d2 = digits[row*2+1] ?? null;
          const modeLabel = MODES[row] ?? null;
          return (
            <>
              <button key={`d${row*2}`} onClick={() => onDigit(d1)}
                className="col-span-1 py-2.5 rounded-xl bg-dark-700 hover:bg-slate-700/60 text-slate-200
                           font-bold text-sm transition-colors active:scale-95">
                {d1}
              </button>
              {d2 != null
                ? <button key={`d${row*2+1}`} onClick={() => onDigit(d2)}
                    className="col-span-1 py-2.5 rounded-xl bg-dark-700 hover:bg-slate-700/60 text-slate-200
                               font-bold text-sm transition-colors active:scale-95">
                    {d2}
                  </button>
                : <div key="empty" className="col-span-1"/> }
              {/* separator col */}
              <div className="col-span-1" />
              {/* mode button */}
              {modeLabel && (
                <button key={modeLabel} onClick={() => setMode(modeLabel)}
                  className={`col-span-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95
                    ${mode === modeLabel
                      ? 'bg-primary-500/30 text-primary-300 border border-primary-500/40'
                      : 'bg-dark-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'}`}>
                  {modeLabel}
                </button>
              )}
            </>
          );
        })}
        {/* Bottom row: +/- | del | mode Qty already at row 0 */}
        <button onClick={onPlusMinus}
          className="col-span-1 py-2.5 rounded-xl bg-dark-700 hover:bg-slate-700/60 text-slate-300 font-bold text-sm transition-colors">
          +/-
        </button>
        <button onClick={onBackspace}
          className="col-span-1 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-sm transition-colors flex items-center justify-center">
          <Delete className="w-4 h-4"/>
        </button>
        <div className="col-span-2"/>
      </div>
    </div>
  );
}

// Better numpad layout — match reference image exactly
function NumpadPanel({ mode, setMode, input, onDigit, onBackspace, onPlusMinus }) {
  return (
    <div className="px-2 pb-2 pt-1">
      {/* Input display */}
      {input && (
        <div className="mb-1.5 px-3 py-1.5 rounded-xl bg-dark-700 border border-slate-700/40 text-right">
          <span className="text-primary-400 font-bold text-base tracking-wider">{input}</span>
          <span className="text-slate-500 text-xs ml-1">{mode === 'Prices' ? '$' : mode === 'Disc.' ? '%' : 'qty'}</span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {/* Row 1 */}
        {['1','2','3','4'].map(d => <NumKey key={d} label={d} onClick={() => onDigit(d)} />)}
        {/* Mode: Prices */}
        {['5','6','7','8'].map(d => <NumKey key={d} label={d} onClick={() => onDigit(d)} />)}
        {/* Row 3 */}
        <NumKey label="9" onClick={() => onDigit('9')} />
        <NumKey label="0" onClick={() => onDigit('0')} />
        <NumKey label="+/-" onClick={onPlusMinus} />
        <button onClick={onBackspace}
          className="py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-sm
                     transition-colors active:scale-95 flex items-center justify-center">
          <Delete className="w-4 h-4"/>
        </button>
      </div>

      {/* Mode buttons */}
      <div className="grid grid-cols-3 gap-1.5 mt-1.5">
        {MODES.map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`py-2 rounded-xl text-xs font-bold transition-all active:scale-95
              ${mode === m
                ? 'bg-primary-500/30 text-primary-300 border border-primary-500/40'
                : 'bg-dark-700 text-slate-400 hover:text-slate-200'}`}>
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumKey({ label, onClick, cls = '' }) {
  return (
    <button onClick={onClick}
      className={`py-2.5 rounded-xl bg-dark-700 hover:bg-slate-700/60 text-slate-200
                 font-bold text-sm transition-colors active:scale-95 ${cls}`}>
      {label}
    </button>
  );
}

// ── CartItem (simplified — selected state shown with highlight) ──────────────
function CartItem({ item, selected, onClick }) {
  const basePrice    = item.priceOverride != null ? item.priceOverride : item.price;
  const effectiveP   = basePrice * (1 - (item.discount || 0) / 100);
  const extrasTotal  = (item.selectedExtras || []).reduce((s, e) => s + e.price, 0);
  const lineTotal    = (effectiveP + extrasTotal) * item.quantity;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2.5 transition-all text-left
        ${selected
          ? 'bg-primary-500/15 border-l-2 border-primary-500'
          : 'border-l-2 border-transparent hover:bg-slate-700/20'}`}
    >
      <span className="text-lg select-none flex-shrink-0">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-100 font-medium">{item.quantity} ×</span>
          <span className="text-sm text-slate-200 truncate">{item.name}</span>
          {item.discount > 0 && (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded-full">-{item.discount}%</span>
          )}
        </div>
        {item.selectedExtras?.length > 0 && (
          <p className="text-[10px] text-amber-400/80 truncate">
            ✨ {item.selectedExtras.map(e => e.name).join(', ')}
          </p>
        )}
        {item.notes && (
          <p className="text-[11px] text-amber-400/80 truncate">📝 {item.notes}</p>
        )}
      </div>
      <span className="text-sm font-semibold text-slate-200 flex-shrink-0">₹{lineTotal.toFixed(2)}</span>
    </button>
  );
}

// ── Cart ─────────────────────────────────────────────────────────────────────
export default function Cart({
  items, tableNumber, orderId, orderStatus,
  subtotal, tax, total, discountTotal,
  onIncrement, onDecrement, onRemove, onEdit, onClear,
  onSendToKitchen, onPay, loading,
  assignedCustomer, onCustomerChange,
}) {
  const isSent = orderStatus === 'sent' || orderStatus === 'preparing' || orderStatus === 'ready';
  const hasItems = items.length > 0;
  // Payment only allowed AFTER order is sent to kitchen
  const canPay = isSent || orderStatus === 'paid';

  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('numpad'); // 'numpad' | 'notes' | 'customer'
  const [mode, setMode] = useState('Qty');
  const [input, setInput] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const selectedItem = items.find(i => i._id === selectedId);

  const handleItemClick = (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setInput('');
      setActiveTab('numpad');
    } else {
      setSelectedId(id);
      setInput('');
      // Auto-switch to Extras tab if this item has available extras
      const clicked = items.find(i => i._id === id);
      if (clicked?.availableExtras?.length > 0) {
        setActiveTab('extras');
      } else {
        setActiveTab('numpad');
      }
    }
  };

  const onDigit = (d) => {
    if (!selectedId) return;
    setInput(prev => {
      // max 6 chars
      if (prev.length >= 6) return prev;
      if (prev === '0') return d;
      return prev + d;
    });
  };

  const onBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const onPlusMinus = () => {
    setInput(prev => {
      if (!prev) return '';
      if (prev.startsWith('-')) return prev.slice(1);
      return '-' + prev;
    });
  };

  // Apply numpad input when mode is used
  const applyInput = () => {
    if (!selectedId || !input) return;
    const val = parseFloat(input);
    if (isNaN(val)) return;
    if (mode === 'Qty') {
      const n = Math.max(1, Math.round(val));
      // set quantity — find current and adjust
      if (selectedItem) {
        const diff = n - selectedItem.quantity;
        if (diff > 0) { for (let i = 0; i < diff; i++) onIncrement(selectedId); }
        else if (diff < 0) { for (let i = 0; i < -diff; i++) onDecrement(selectedId); }
      }
    } else if (mode === 'Prices') {
      onEdit(selectedId, { priceOverride: Math.max(0, val) });
    } else if (mode === 'Disc.') {
      onEdit(selectedId, { discount: Math.min(100, Math.max(0, val)) });
    }
    setInput('');
  };

  // Apply on each digit — live mode
  // Actually apply when a mode button is toggled or enter-style: apply on mode switch
  const handleSetMode = (m) => {
    applyInput();
    setMode(m);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-dark-800 border-l border-slate-700/50">

      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary-400" />
          <span className="font-display font-semibold text-slate-100 text-sm">Order</span>
          {tableNumber && <span className="badge-warning badge text-[10px]">T{tableNumber}</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasItems && (
            <button onClick={onClear} className="text-slate-500 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasItems && !isSent ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 py-10">
            <ShoppingCart className="w-8 h-8 text-slate-700" />
            <p className="text-slate-600 text-sm">Cart is empty</p>
          </div>
        ) : (
          <div>
            {isSent && !hasItems && (
              <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <ChefHat className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">In kitchen — add more or pay</p>
              </div>
            )}
            {items.map(item => (
              <CartItem
                key={item._id}
                item={item}
                selected={selectedId === item._id}
                onClick={() => handleItemClick(item._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom section ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-slate-700/50">

        {/* Totals */}
        {hasItems && (
          <div className="px-3 py-2 space-y-0.5 text-xs border-b border-slate-700/30">
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>🏷️ Discount</span><span>-₹{discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Tax {subtotal > 0 && `(${((tax/subtotal)*100).toFixed(1).replace(/\.0$/,'')}%)`}</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-100 text-sm pt-0.5">
              <span>Total</span>
              <span className="text-primary-400">₹{total.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Tab bar: Customer | Notes | Extras */}
        <div className="flex border-b border-slate-700/30">
          {['Customer', 'Notes', 'Extras'].map(tab => {
            const isExtrasTab = tab === 'Extras';
            const hasAvailExtras = isExtrasTab && selectedItem?.availableExtras?.length > 0;
            const hasSelectedExtras = isExtrasTab && selectedItem?.selectedExtras?.length > 0;
            const isActive = activeTab === tab.toLowerCase();
            return (
              <button key={tab}
                onClick={() => {
                  setActiveTab(isActive ? 'numpad' : tab.toLowerCase());
                  setShowPicker(false);
                }}
                className={`flex-1 py-2 text-[11px] font-semibold transition-all flex items-center justify-center gap-1 relative
                  ${isActive
                    ? isExtrasTab ? 'text-amber-400 border-b-2 border-amber-500' : 'text-primary-400 border-b-2 border-primary-500'
                    : hasAvailExtras
                      ? 'text-amber-400/70 hover:text-amber-400'
                      : 'text-slate-500 hover:text-slate-300'}`}>
                {isExtrasTab && <Sparkles className="w-3 h-3" />}
                {tab}
                {hasSelectedExtras && (
                  <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Customer panel */}
        {activeTab === 'customer' && (
          <div className="px-3 py-2">
            {assignedCustomer ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-500/10 border border-primary-500/25">
                <div className="w-6 h-6 rounded-full bg-primary-500/25 flex items-center justify-center text-xs font-bold text-primary-300">
                  {assignedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary-300 truncate">{assignedCustomer.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{assignedCustomer.email}</p>
                </div>
                <button onClick={() => { onCustomerChange(null); }} className="text-slate-500 hover:text-red-400">
                  <X className="w-3.5 h-3.5"/>
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {showPicker
                  ? <CustomerPicker onSelect={c => { onCustomerChange(c); setShowPicker(false); setActiveTab('numpad'); }} onClose={() => setShowPicker(false)} />
                  : (
                    <button onClick={() => setShowPicker(true)}
                      className="w-full py-2 rounded-xl border border-dashed border-slate-700/50 text-slate-500 hover:text-primary-400
                                 hover:border-primary-500/40 text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                      <User className="w-3.5 h-3.5"/> Assign Customer
                    </button>
                  )}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Notes panel */}
        {activeTab === 'notes' && selectedItem && (
          <div className="px-3 py-2">
            <label className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
              Notes for {selectedItem.name}
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Less sugar, no ice..."
              value={selectedItem.notes || ''}
              onChange={e => onEdit(selectedItem._id, { notes: e.target.value })}
              className="w-full mt-1 bg-slate-800/80 border border-slate-700/40 rounded-xl px-3 py-2
                         text-xs text-slate-200 placeholder:text-slate-600 resize-none
                         focus:outline-none focus:border-amber-500/40 transition-colors"
            />
          </div>
        )}
        {activeTab === 'notes' && !selectedItem && (
          <div className="px-3 py-3 text-center text-xs text-slate-600">
            Select an item above to add notes
          </div>
        )}

        {/* ── Extras panel ──────────────────────────────────────── */}
        {activeTab === 'extras' && selectedItem && selectedItem.availableExtras?.length > 0 && (
          <div className="px-3 py-2.5 space-y-2">
            <label className="text-[10px] text-amber-400 uppercase font-semibold tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Extras for {selectedItem.name}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {selectedItem.availableExtras.map(extra => {
                const isSelected = selectedItem.selectedExtras?.some(e => e.name === extra.name);
                return (
                  <button
                    key={extra.name}
                    onClick={() => {
                      const current = selectedItem.selectedExtras || [];
                      const updated = isSelected
                        ? current.filter(e => e.name !== extra.name)   // tap again → deselect
                        : [{ name: extra.name, price: extra.price }];  // pick one → replace all
                      onEdit(selectedItem._id, { selectedExtras: updated });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-amber-500/25 text-amber-300 border-amber-500/50'
                        : 'bg-dark-700 text-slate-400 border-slate-700/40 hover:border-amber-500/40 hover:text-amber-400'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{extra.name}
                    <span className="ml-1 opacity-70">₹{extra.price}</span>
                  </button>
                );
              })}
            </div>
            {selectedItem.selectedExtras?.length > 0 && (
              <p className="text-[10px] text-amber-400/70 pt-0.5">
                Extras: +₹{selectedItem.selectedExtras.reduce((s, e) => s + e.price, 0)} per item
                · Total: ₹{((selectedItem.selectedExtras.reduce((s,e)=>s+e.price,0)) * selectedItem.quantity).toFixed(0)} extra
              </p>
            )}
          </div>
        )}
        {activeTab === 'extras' && selectedItem && !selectedItem.availableExtras?.length && (
          <div className="px-3 py-3 text-center text-xs text-slate-600">
            No extras available for {selectedItem.name}
          </div>
        )}
        {activeTab === 'extras' && !selectedItem && (
          <div className="px-3 py-3 text-center text-xs text-slate-600">
            Select an item above to view extras
          </div>
        )}

        {/* Numpad */}
        {activeTab === 'numpad' && hasItems && (
          <NumpadPanel
            mode={mode}
            setMode={handleSetMode}
            input={input}
            onDigit={onDigit}
            onBackspace={onBackspace}
            onPlusMinus={onPlusMinus}
          />
        )}

        {/* Apply button for numpad (visible when input entered) */}
        {activeTab === 'numpad' && input && selectedId && (
          <div className="px-2 pb-1.5">
            <button onClick={applyInput}
              className="w-full py-2 rounded-xl bg-primary-500/20 border border-primary-500/30 text-primary-400
                         text-xs font-bold hover:bg-primary-500/30 transition-colors">
              Apply {mode}: {input}{mode === 'Prices' ? ' ₹' : mode === 'Disc.' ? ' %' : ' qty'}
            </button>
          </div>
        )}

        {/* Action buttons */}
        {(hasItems || canPay) && (
          <div className="px-2 pb-3 grid grid-cols-2 gap-2">
            {hasItems && (
              <button onClick={onSendToKitchen} disabled={loading}
                className="py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 font-bold text-sm
                           transition-colors disabled:opacity-50 flex flex-col items-center justify-center gap-0.5">
                <ChefHat className="w-4 h-4 text-amber-400" />
                <span className="text-xs">Send</span>
                <span className="text-[10px] text-slate-400">Qty: {items.reduce((s,i)=>s+i.quantity,0)}</span>
              </button>
            )}
            <button
              onClick={canPay ? onPay : undefined}
              disabled={loading || !canPay}
              title={!canPay ? 'Send order to kitchen first' : ''}
              className={`py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-0.5
                ${hasItems ? 'col-span-1' : 'col-span-2'}
                ${canPay
                  ? 'bg-accent-500 hover:bg-accent-400 text-dark-900 cursor-pointer'
                  : 'bg-slate-700/40 text-slate-600 cursor-not-allowed border border-slate-700/30'}`}
            >
              <CreditCard className={`w-4 h-4 ${canPay ? '' : 'opacity-40'}`} />
              <span className="text-xs">Payment</span>
              {!canPay && <span className="text-[10px] text-slate-600">Send first</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}