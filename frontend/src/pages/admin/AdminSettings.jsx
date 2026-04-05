import { useState, useEffect } from 'react';
import { Settings, Info, Smartphone, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [form, setForm]       = useState({ upiId: '', cafeName: '', taxRate: 5, currency: 'INR' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => setForm({
        upiId:    data.upiId    || '',
        cafeName: data.cafeName || 'POS Cafe',
        taxRate:  data.taxRate  ?? 5,
        currency: data.currency || 'INR',
      }))
      .catch(() => toast.error('Could not load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', form);
      setSaved(true);
      toast.success('Settings saved!');
      setTimeout(() => setSaved(false), 2500);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const change = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">System configuration</p>
      </div>

      <form onSubmit={handleSave} className="max-w-xl space-y-4">

        {/* General Settings */}
        <div className="bg-dark-800 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-200">General Settings</h2>
              <p className="text-xs text-slate-500">Manage your café configuration</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Café Name</label>
              <input
                className="input"
                value={form.cafeName}
                onChange={change('cafeName')}
                placeholder="My Café"
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Tax Rate (%)</label>
                <input
                  className="input"
                  type="number"
                  min={0} max={100} step={0.1}
                  value={form.taxRate}
                  onChange={change('taxRate')}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Currency</label>
                <input
                  className="input"
                  value={form.currency}
                  onChange={change('currency')}
                  placeholder="INR"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* UPI Payment Settings */}
        <div className="bg-dark-800 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-200">UPI Payment</h2>
              <p className="text-xs text-slate-500">Used for generating UPI QR at checkout</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">UPI ID</label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                className="input pl-9 font-mono"
                value={form.upiId}
                onChange={change('upiId')}
                placeholder="yourcafe@upi  or  9876543210@paytm"
                disabled={loading}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Formats: <span className="font-mono text-slate-500">name@bank</span> · <span className="font-mono text-slate-500">number@paytm</span> · <span className="font-mono text-slate-500">number@upi</span>
            </p>

            {/* Live QR preview */}
            {form.upiId && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-4 p-3 rounded-xl
                             bg-purple-500/5 border border-purple-500/20"
                >
                  <div className="text-2xl">📱</div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">QR will be generated for:</p>
                    <p className="text-sm font-mono text-purple-400 font-bold">{form.upiId}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Save Button */}
        <motion.button
          type="submit"
          disabled={saving || loading}
          whileTap={{ scale: 0.98 }}
          className={`w-full py-3 rounded-2xl font-bold text-base
            flex items-center justify-center gap-2 transition-all duration-300
            ${saved
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
              : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/20 disabled:opacity-60'
            }`}
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4" />Settings Saved!</>
          ) : (
            <><Save className="w-4 h-4" />Save Settings</>
          )}
        </motion.button>
      </form>

      {/* System Info */}
      <div className="max-w-xl">
        <div className="bg-dark-800 border border-slate-700/40 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">System Info</p>
              <div className="text-xs text-slate-500 space-y-1">
                <p>Version: 1.0.0</p>
                <p>Stack: MERN + Socket.io</p>
                <p>Roles: Admin · Staff · Kitchen</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
