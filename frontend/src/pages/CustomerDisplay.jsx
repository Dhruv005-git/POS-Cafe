import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useBroadcastListener } from '../hooks/useBroadcast.js';
import { useSocketEvent } from '../hooks/useSocket.js';

// ── Clock ─────────────────────────────────────────────────────────────────────
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  return {
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    date: now.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' }),
  };
}

// ── Left panel (always shown) ─────────────────────────────────────────────────
function LeftPanel({ storeName = 'POS Cafe' }) {
  const { time, date } = useClock();
  return (
    <div className="w-72 flex-shrink-0 flex flex-col items-center justify-between py-12 px-8 border-r border-slate-700/40"
         style={{ background: 'rgba(15,23,42,0.95)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
             style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
          <span className="text-4xl">☕</span>
        </div>
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-white">{storeName}</h1>
          <p className="text-slate-400 text-sm mt-1">Welcome!</p>
        </div>
      </div>

      <div className="text-center space-y-1">
        <p className="font-display font-bold text-4xl text-slate-100 tabular-nums">{time}</p>
        <p className="text-slate-500 text-sm">{date}</p>
      </div>

      <p className="text-xs text-slate-600 text-center">Powered by POS Cafe</p>
    </div>
  );
}

// ── Screen 1: Bill / Idle ─────────────────────────────────────────────────────
function BillScreen({ order, storeName }) {
  if (!order || order.items?.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-24 h-24 rounded-3xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center"
        >
          <span className="text-5xl">🛒</span>
        </motion.div>
        <div className="text-center">
          <p className="font-display font-bold text-3xl text-slate-300">Your order will</p>
          <p className="font-display font-bold text-3xl text-slate-300">appear here</p>
          <p className="text-slate-600 mt-2 text-sm">Items are added as you order</p>
        </div>
      </div>
    );
  }

  const { items = [], subtotal = 0, tax = 0, total = 0, discountTotal = 0 } = order;

  return (
    <div className="flex-1 flex flex-col overflow-hidden py-8 px-8">
      <h2 className="font-display font-bold text-xl text-slate-200 mb-5">Your Order</h2>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-1">
        <AnimatePresence>
          {items.map((item, idx) => {
            const baseP = item.priceOverride != null ? item.priceOverride : item.price;
            const effP  = baseP * (1 - (item.discount || 0) / 100);
            const extras = (item.selectedExtras || []).reduce((s, e) => s + e.price, 0);
            const lineT = (effP + extras) * item.quantity;
            return (
              <motion.div
                key={item._id || idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 py-2.5 border-b border-slate-700/30 last:border-0"
              >
                <span className="text-2xl flex-shrink-0">{item.emoji || '🍽️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 font-medium">{item.quantity} × {item.name}</p>
                  {item.selectedExtras?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {item.selectedExtras.map(e => (
                        <span key={e.name} className="inline-flex items-center gap-0.5 text-[10px] font-semibold
                          px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          ✨ {e.name} +₹{e.price}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-xs text-amber-400/70 truncate">📝 {item.notes}</p>
                  )}
                  {item.discount > 0 && (
                    <span className="text-[10px] text-emerald-400">-{item.discount}% discount</span>
                  )}
                </div>
                <span className="font-semibold text-slate-200 text-lg">₹{lineT.toFixed(2)}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Totals */}
      <div className="border-t border-slate-700/40 pt-4 space-y-2">
        {discountTotal > 0 && (
          <div className="flex justify-between text-emerald-400 text-sm">
            <span>🏷️ Discount</span>
            <span>-₹{discountTotal.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-slate-400 text-sm">
          <span>Tax</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-display font-bold text-2xl pt-1 border-t border-slate-700/40">
          <span className="text-slate-100">Total</span>
          <span className="text-primary-400">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Screen 2: UPI QR ─────────────────────────────────────────────────────────
function UpiScreen({ amount = 0, upiId = 'cafe@ybl', storeName }) {
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName || 'POS Cafe')}&am=${amount.toFixed(2)}&cu=INR&tn=Order+Payment`;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-10 px-8">
      <div className="text-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-1">UPI Payment</p>
        <p className="font-display font-bold text-4xl text-primary-400">₹{amount.toFixed(2)}</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-black/40">
          <QRCodeSVG
            value={upiUrl}
            size={220}
            bgColor="#ffffff"
            fgColor="#0f172a"
            level="M"
            includeMargin={false}
          />
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Scan with any UPI app</p>
          <p className="text-primary-400 font-mono text-sm mt-1">{upiId}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-2.5 h-2.5 rounded-full bg-amber-400"
        />
        <span className="text-amber-400 text-sm font-medium">Waiting for payment...</span>
      </div>
    </div>
  );
}

// ── Screen 3: Thank You ───────────────────────────────────────────────────────
function ThankYouScreen({ storeName }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-10 px-8">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="w-28 h-28 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #10b981, #34d399)', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }}
      >
        <span className="text-6xl">✓</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center space-y-3"
      >
        <p className="font-display font-bold text-5xl text-white">Thank You!</p>
        <p className="font-display text-2xl text-slate-300">For shopping with us.</p>
        <p className="text-slate-500 text-lg mt-2">See you again soon 👋</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
      >
        <p className="text-emerald-400 text-sm font-medium text-center">Payment successful ✓</p>
      </motion.div>
    </div>
  );
}

// ── Main CustomerDisplay ──────────────────────────────────────────────────────
export default function CustomerDisplay() {
  const [screen, setScreen] = useState('idle'); // 'idle' | 'bill' | 'upi' | 'thankyou'
  const [order, setOrder]   = useState(null);   // { items, subtotal, tax, total, discountTotal }
  const [upiData, setUpiData] = useState({ amount: 0, upiId: 'cafe@ybl' });
  const [storeName, setStoreName] = useState('POS Cafe');

  // Fetch store name from settings
  useEffect(() => {
    import('../api/axios.js').then(({ default: api }) => {
      api.get('/settings')
        .then(({ data }) => {
          if (data.storeName) setStoreName(data.storeName);
          if (data.upiId)    setUpiData(prev => ({ ...prev, upiId: data.upiId }));
        })
        .catch(() => {});
    });
  }, []);

  // Listen to BroadcastChannel messages from staff POS
  useBroadcastListener((msg) => {
    switch (msg.type) {
      case 'bill':
        setOrder(msg.order);
        setScreen('bill');
        break;
      case 'upi':
        setUpiData({ amount: msg.amount, upiId: msg.upiId || 'cafe@ybl' });
        setScreen('upi');
        break;
      case 'thankyou':
        setScreen('thankyou');
        // Auto-return to idle after 8 seconds
        setTimeout(() => { setScreen('idle'); setOrder(null); }, 8000);
        break;
      case 'idle':
        setScreen('idle');
        setOrder(null);
        break;
      default:
        break;
    }
  });

  // Also listen to socket payment_done as fallback
  useSocketEvent('payment_done', () => {
    setScreen('thankyou');
    setTimeout(() => { setScreen('idle'); setOrder(null); }, 5000);
  });

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{
        background: '#0f172a',
        backgroundImage: 'radial-gradient(ellipse at 30% 0%, rgba(99,102,241,0.06) 0%, transparent 50%)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Left panel — always visible */}
      <LeftPanel storeName={storeName} />

      {/* Right panel — screen content */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {screen === 'idle' && (
            <motion.div key="idle" className="flex-1 flex"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <BillScreen order={null} storeName={storeName} />
            </motion.div>
          )}
          {screen === 'bill' && (
            <motion.div key="bill" className="flex-1 flex"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
              <BillScreen order={order} storeName={storeName} />
            </motion.div>
          )}
          {screen === 'upi' && (
            <motion.div key="upi" className="flex-1 flex"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }}>
              <UpiScreen amount={upiData.amount} upiId={upiData.upiId} storeName={storeName} />
            </motion.div>
          )}
          {screen === 'thankyou' && (
            <motion.div key="thankyou" className="flex-1 flex"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }}>
              <ThankYouScreen storeName={storeName} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}