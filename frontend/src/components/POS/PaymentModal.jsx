import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  X, Banknote, CreditCard, Smartphone,
  CheckCircle, ChevronRight, ArrowLeft,
  ReceiptText, Loader2
} from 'lucide-react';
import api from '../../api/axios.js';
import { sound } from '../../utils/sound.js';
import { notify } from '../../utils/toast.js';
import { broadcastToDisplay } from '../../hooks/useBroadcast.js';

// ─── Confetti burst (pure CSS/JS, no library) ───────────────────────────────
function ConfettiBurst() {
  const colors = ['#6366f1','#f59e0b','#10b981','#f43f5e','#3b82f6','#a855f7'];
  const pieces = Array.from({ length: 32 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    x: (Math.random() - 0.5) * 400,
    y: -(Math.random() * 300 + 100),
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.6 + 0.4,
    shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'triangle',
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, rotate: p.rotate, scale: p.scale }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: Math.random() * 0.2 }}
          style={{ position: 'absolute', backgroundColor: p.color,
            width: p.shape === 'circle' ? 10 : 8,
            height: p.shape === 'circle' ? 10 : p.shape === 'triangle' ? 8 : 14,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? 2 : 0,
            clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────────────
function SuccessScreen({ method, total, change, tableNumber }) {
  const methodLabels = { cash: 'Cash', card: 'Card', upi: 'UPI' };
  const methodEmojis = { cash: '💵', card: '💳', upi: '📱' };

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-6 relative">
      <ConfettiBurst />
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center"
      >
        <CheckCircle className="w-12 h-12 text-emerald-400" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-1"
      >
        <p className="font-display font-bold text-2xl text-slate-100">Payment Complete!</p>
        <p className="text-slate-400 text-sm">
          {methodEmojis[method]} Paid via {methodLabels[method]}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card px-8 py-4 text-center space-y-1"
      >
        <p className="text-xs text-slate-500 uppercase tracking-wider">Amount Paid</p>
        <p className="font-display font-bold text-3xl text-primary-400">₹{total.toFixed(2)}</p>
        {method === 'cash' && change > 0 && (
          <p className="text-emerald-400 text-sm font-semibold mt-1">
          Change: ₹{change.toFixed(2)}
          </p>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-slate-600 text-xs"
      >
        {tableNumber ? 'Table has been freed' : 'Thank you for your order!'}
      </motion.p>
    </div>
  );
}

// ─── Method Selector ─────────────────────────────────────────────────────────
function MethodSelector({ onSelect }) {
  const methods = [
    { id: 'cash', label: 'Cash', icon: Banknote, desc: 'Accept cash payment', color: 'emerald' },
    { id: 'card', label: 'Card', icon: CreditCard, desc: 'Debit or credit card', color: 'blue' },
    { id: 'upi',  label: 'UPI QR', icon: Smartphone, desc: 'Scan to pay', color: 'purple' },
  ];

  const colorMap = {
    emerald: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400',
    blue:    'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400',
    purple:  'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 hover:bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 text-center mb-4">Select payment method</p>
      {methods.map(m => {
        const Icon = m.icon;
        return (
          <motion.button
            key={m.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(m.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${colorMap[m.color]}`}
          >
            <div className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-100">{m.label}</p>
              <p className="text-xs text-slate-500">{m.desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Cash Flow ───────────────────────────────────────────────────────────────
function CashFlow({ total, onConfirm, loading }) {
  const [received, setReceived] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const receivedNum = parseFloat(received) || 0;
  const change = receivedNum - total;
  const isValid = receivedNum >= total;

  // Quick amount presets
  const presets = [
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total).slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="card p-4 flex justify-between items-center">
        <span className="text-slate-400 text-sm">Bill Amount</span>
        <span className="font-display font-bold text-xl text-slate-100">₹{total.toFixed(2)}</span>
      </div>

      <div className="space-y-2">
        <label className="text-xs text-slate-400 uppercase tracking-wider">Amount Received</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
          <input
            ref={inputRef}
            type="number"
            value={received}
            onChange={e => setReceived(e.target.value)}
            placeholder="0.00"
            min={0}
            step="0.01"
            className="input pl-7 text-lg font-semibold"
          />
        </div>

        {/* Quick preset buttons */}
        {presets.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setReceived(String(p))}
                className="px-3 py-1.5 rounded-lg bg-dark-700 hover:bg-dark-700/70 text-xs font-semibold text-slate-300 border border-slate-700/50 hover:border-slate-600 transition-all"
              >
                ₹{p}
              </button>
            ))}
            <button
              onClick={() => setReceived(total.toFixed(2))}
              className="px-3 py-1.5 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 text-xs font-semibold text-primary-400 border border-primary-500/20 transition-all"
            >
              Exact
            </button>
          </div>
        )}
      </div>

      {/* Change display */}
      <AnimatePresence mode="wait">
        {receivedNum > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-xl p-4 flex justify-between items-center border-2
              ${isValid
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'}`}
          >
            <span className={`text-sm font-medium ${isValid ? 'text-emerald-300' : 'text-red-300'}`}>
              {isValid ? 'Change to Return' : 'Insufficient amount'}
            </span>
            <span className={`font-display font-bold text-xl ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {isValid ? `₹${change.toFixed(2)}` : `₹${(total - receivedNum).toFixed(2)} short`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => onConfirm('cash', change)}
        disabled={!isValid || loading}
        className="btn-accent w-full py-3 flex items-center justify-center gap-2 font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CheckCircle className="w-4 h-4" />}
        Confirm Cash Payment
      </button>
    </div>
  );
}

// ─── Card Flow ───────────────────────────────────────────────────────────────
function CardFlow({ total, onConfirm, loading }) {
  return (
    <div className="space-y-5">
      <div className="card p-6 flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <CreditCard className="w-8 h-8 text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Present card or tap device</p>
          <p className="font-display font-bold text-3xl text-slate-100 mt-1">₹{total.toFixed(2)}</p>
        </div>

        {/* Fake card terminal animation */}
        <div className="w-full bg-dark-700 rounded-xl p-3 border border-slate-700/50 flex items-center gap-3">
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-blue-400"
              />
            ))}
          </div>
          <span className="text-xs text-slate-500">Waiting for card tap...</span>
        </div>
      </div>

      <button
        onClick={() => onConfirm('card', 0)}
        disabled={loading}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-semibold text-base disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CheckCircle className="w-4 h-4" />}
        Confirm Card Payment
      </button>
    </div>
  );
}

// ─── UPI Flow ────────────────────────────────────────────────────────────────
function UpiFlow({ total, onConfirm, loading }) {
  const [upiId, setUpiId] = useState('cafe@ybl');

  useEffect(() => {
    api.get('/settings').then(({ data }) => setUpiId(data.upiId)).catch(() => {});
  }, []);

  const upiUrl = `upi://pay?pa=${upiId}&pn=POS+Cafe&am=${total.toFixed(2)}&cu=INR&tn=POS+Cafe+Order`;

  return (
    <div className="space-y-5">
      <div className="card p-6 flex flex-col items-center gap-4">
        <p className="text-sm text-slate-400">Scan to pay</p>

        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/40">
          <QRCodeSVG
            value={upiUrl}
            size={200}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
            includeMargin={false}
          />
        </div>

        <div className="text-center space-y-1">
          <p className="font-display font-bold text-2xl text-slate-100">₹{total.toFixed(2)}</p>
          <p className="text-xs text-slate-500">UPI ID: <span className="text-primary-400 font-mono">{upiId}</span></p>
        </div>

        {/* Pulsing indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-amber-400"
          />
          <span className="text-xs text-amber-400 font-medium">Waiting for payment...</span>
        </div>
      </div>

      <button
        onClick={() => onConfirm('upi', 0)}
        disabled={loading}
        className="btn-accent w-full py-3 flex items-center justify-center gap-2 font-semibold text-base disabled:opacity-50"
      >
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <CheckCircle className="w-4 h-4" />}
        Payment Received — Confirm
      </button>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
export default function PaymentModal({ isOpen, onClose, onSuccess, orderId, cartItems, total, tableNumber }) {
  const [step, setStep] = useState('method');   // 'method' | 'cash' | 'card' | 'upi' | 'success'
  const [method, setMethod] = useState(null);
  const [change, setChange] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) { setStep('method'); setMethod(null); setChange(0); }
  }, [isOpen]);

  const handleSelectMethod = async (m) => {
    setMethod(m);
    setStep(m);
    // Broadcast UPI screen to customer display
    if (m === 'upi') {
      let upiId = 'cafe@ybl';
      try { const { data } = await api.get('/settings'); upiId = data.upiId || upiId; } catch {}
      broadcastToDisplay({ type: 'upi', amount: total, upiId });
    }
  };

  const handleConfirm = async (m, changeAmt) => {
    try {
      setLoading(true);
      setChange(changeAmt);

      // If we have an orderId (existing DB order), pay it directly
      // If we only have cartItems (no order created yet), create then pay
      let id = orderId;
      if (!id && cartItems?.length > 0) {
        const { data } = await api.post('/orders', {
          tableId: null,
          tableNumber,
          items: cartItems.map(i => ({
            product: i._id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            emoji: i.emoji,
          })),
        });
        id = data.order._id;
      }

      await api.put(`/orders/${id}/pay`, { method: m });
      sound.paymentDone();
      notify.payment(m, total);
      broadcastToDisplay({ type: 'thankyou' });
      setStep('success');
      setTimeout(() => onSuccess(), 2200);
    } catch (err) {
      const msg = err.response?.data?.message || 'Payment failed';
      // Re-throw so individual flow can handle
      setLoading(false);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepTitle = {
    method:  'Select Payment',
    cash:    'Cash Payment',
    card:    'Card Payment',
    upi:     'UPI Payment',
    success: 'Payment Complete',
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={step !== 'success' ? onClose : undefined}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />

          {/* Centering wrapper — flex, no transform conflict */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="pointer-events-auto w-full max-w-md rounded-3xl border border-slate-700/50 shadow-2xl max-h-[85vh] flex flex-col"
            style={{ background: '#172033' }}
          >
            {/* Spacer top */}
            <div className="w-10 h-1 bg-slate-700/50 rounded-full mx-auto mt-3" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                {step !== 'method' && step !== 'success' && (
                  <button
                    onClick={() => setStep('method')}
                    className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-dark-700/70 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                  </button>
                )}
                <div>
                  <p className="font-display font-bold text-slate-100">{stepTitle[step]}</p>
                  {tableNumber && step !== 'success' && (
                    <p className="text-xs text-slate-500">Table {tableNumber} · ₹{total.toFixed(2)}</p>
                  )}
                </div>
              </div>
              {step !== 'success' && (
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-dark-700 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Order summary strip (always visible unless success) */}
            {step !== 'success' && cartItems?.length > 0 && (
              <div className="mx-6 mt-4 card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <ReceiptText className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-500 uppercase tracking-wider">Order Summary</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {cartItems.map(item => {
                    const extrasTotal = (item.selectedExtras || []).reduce((s, e) => s + e.price, 0);
                    const itemLine = (item.price + extrasTotal) * item.quantity;
                    return (
                      <div key={item._id} className="space-y-0.5">
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>{item.emoji} {item.name} ×{item.quantity}</span>
                          <span>₹{itemLine.toFixed(2)}</span>
                        </div>
                        {item.selectedExtras?.length > 0 && (
                          <div className="flex flex-wrap gap-1 pl-5">
                            {item.selectedExtras.map(e => (
                              <span key={e.name} className="text-[10px] text-amber-400/80 font-medium">
                                ✨{e.name} +₹{e.price}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-700/40">
                  <span className="text-xs font-bold text-slate-300">Total</span>
                  <span className="text-xs font-bold text-primary-400">₹{total.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Step content */}
            <div className="px-6 py-5 flex-1 overflow-y-auto min-h-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: step === 'method' ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {step === 'method' && <MethodSelector onSelect={handleSelectMethod} />}
                  {step === 'cash'   && <CashFlow total={total} onConfirm={handleConfirm} loading={loading} />}
                  {step === 'card'   && <CardFlow total={total} onConfirm={handleConfirm} loading={loading} />}
                  {step === 'upi'    && <UpiFlow  total={total} onConfirm={handleConfirm} loading={loading} />}
                  {step === 'success' && <SuccessScreen method={method} total={total} change={change} tableNumber={tableNumber} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  , document.body);
}
