import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, getRoleRedirect } from '../context/AuthContext.jsx';

const ROLES = [
  { value: 'admin',    label: 'Admin',    icon: '👑', desc: 'Full access' },
  { value: 'staff',    label: 'Staff',    icon: '🧾', desc: 'POS & orders' },
  { value: 'kitchen',  label: 'Kitchen',  icon: '👨‍🍳', desc: 'Kitchen display' },
  { value: 'customer', label: 'Customer', icon: '🙋', desc: 'Order tracking' },
];

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let data;
      if (mode === 'login') {
        data = await login(form.email, form.password);
      } else {
        data = await signup(form.name, form.email, form.password, form.role);
      }
      navigate(getRoleRedirect(data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <motion.div
        className="hidden lg:flex flex-col justify-between w-1/2 bg-dark-850 p-12
                   border-r border-slate-700/30 relative overflow-hidden"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/3 -left-20 w-80 h-80 rounded-full
                          bg-primary-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-60 h-60 rounded-full
                          bg-accent-500/8 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500
                            to-primary-700 flex items-center justify-center shadow-lg
                            shadow-primary-500/30">
              <span className="text-xl">☕</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-100">POS Cafe</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-display font-bold text-slate-100 leading-tight mb-4">
            Restaurant<br />
            <span className="text-primary-400">POS System</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Table-based ordering, real-time kitchen display,
            and multi-payment checkout — all in one place.
          </p>

          <div className="mt-8 space-y-3">
            {[
              { icon: '🍽️', text: 'Table & floor management' },
              { icon: '📡', text: 'Real-time kitchen display' },
              { icon: '💳', text: 'Cash, card, UPI QR payments' },
              { icon: '📊', text: 'Sales reports & analytics' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 text-slate-300"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08 }}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-sm">
          Restaurant POS — MERN + Socket.io
        </p>
      </motion.div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500
                            to-primary-700 flex items-center justify-center">
              <span className="text-lg">☕</span>
            </div>
            <span className="font-display font-bold text-lg text-slate-100">POS Cafe</span>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-dark-800 border border-slate-700/50 rounded-xl p-1 mb-8">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize
                  ${mode === m
                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold text-slate-100">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login'
                ? 'Sign in to continue to your workspace'
                : 'Set up your account'}
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30
                           text-red-400 text-sm flex items-center gap-2"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <span>⚠️</span> {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Full name
                  </label>
                  <input
                    className="input"
                    name="name"
                    placeholder="John Smith"
                    value={form.name}
                    onChange={handleChange}
                    required={mode === 'signup'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="you@cafe.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                className="input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* Role picker (signup only) */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                        className={`p-3 rounded-xl border text-center transition-all duration-200
                          ${form.role === r.value
                            ? 'border-primary-500/70 bg-primary-500/15 shadow-sm shadow-primary-500/20'
                            : 'border-slate-700/50 bg-dark-800 hover:border-slate-600'
                          }`}
                      >
                        <div className="text-xl mb-1">{r.icon}</div>
                        <div className="text-xs font-medium text-slate-200">{r.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              className="btn-primary w-full py-2.5 text-base mt-2"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white
                                   rounded-full animate-spin" />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : mode === 'login' ? (
                'Sign in →'
              ) : (
                'Create account →'
              )}
            </motion.button>
          </form>

          {/* Demo credentials */}
          {mode === 'login' && (
            <motion.div
              className="mt-6 p-4 rounded-xl bg-dark-800 border border-slate-700/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wide">
                Quick demo fill
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'admin@cafe.com', password: 'admin123' })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400
                             border border-primary-500/20 hover:bg-primary-500/20 transition-colors"
                >
                  👑 Admin
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'staff@cafe.com', password: 'staff123' })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-400
                             border border-slate-600/30 hover:bg-slate-700/60 transition-colors"
                >
                  🧾 Staff
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'kitchen@cafe.com', password: 'kitchen123' })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400
                             border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  👨‍🍳 Kitchen
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, email: 'customer@cafe.com', password: 'customer123' })}
                  className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400
                             border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  🙋 Customer
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}