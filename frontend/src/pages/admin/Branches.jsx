import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, GitBranch, Phone, Mail, MapPin, X, Check, MonitorPlay, LayoutGrid } from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';

const emptyForm = { name: '', address: '', phone: '', email: '' };

function BranchModal({ branch, onClose, onSaved }) {
  const [form, setForm] = useState(branch || emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (branch?._id) {
        const { data } = await api.put(`/branches/${branch._id}`, form);
        onSaved(data.branch, 'updated');
      } else {
        const { data } = await api.post('/branches', form);
        onSaved(data.branch, 'created');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-dark-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-slate-100 text-lg">
            {branch?._id ? 'Edit Branch' : 'New Branch'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { name: 'name',    label: 'Branch Name', placeholder: 'Main Branch', icon: GitBranch, required: true },
            { name: 'address', label: 'Address',      placeholder: '123 Main St', icon: MapPin },
            { name: 'phone',   label: 'Phone',        placeholder: '+1 234 567 8900', icon: Phone },
            { name: 'email',   label: 'Email',        placeholder: 'branch@cafe.com', icon: Mail, type: 'email' },
          ].map(({ name, label, placeholder, icon: Icon, required, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="input pl-9"
                  name={name}
                  type={type || 'text'}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={(e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))}
                  required={required}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400
                         border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              {branch?._id ? 'Save Changes' : 'Create Branch'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const { setSelectedBranch } = useAuth();
  const navigate = useNavigate();

  const handleOpenSession = (branch) => {
    setSelectedBranch(branch);
    // Navigate based on whether branch has floor plan (tables) or is register-only
    if (branch.hasFloorPlan === false) {
      navigate('/pos/register');
    } else {
      navigate('/pos/floor');
    }
    toast.success(`Opening session for ${branch.name}`);
  };

  const handleToggleFloorPlan = async (branch) => {
    const newVal = branch.hasFloorPlan === false ? true : false;
    try {
      const { data } = await api.put(`/branches/${branch._id}`, { hasFloorPlan: newVal });
      setBranches(prev => prev.map(b => b._id === branch._id ? data.branch : b));
      toast.success(`Floor plan ${newVal ? 'enabled' : 'disabled'} for ${branch.name}`);
    } catch {
      toast.error('Failed to update branch');
    }
  };

  const fetchBranches = useCallback(async () => {
    try {
      const { data } = await api.get('/branches');
      setBranches(data.branches);
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleSaved = (branch, action) => {
    if (action === 'created') {
      setBranches(prev => [...prev, branch]);
      toast.success('Branch created!');
    } else {
      setBranches(prev => prev.map(b => b._id === branch._id ? branch : b));
      toast.success('Branch updated!');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this branch?')) return;
    setDeleting(id);
    try {
      await api.delete(`/branches/${id}`);
      setBranches(prev => prev.filter(b => b._id !== id));
      toast.success('Branch deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">Branches</h1>
          <p className="text-slate-500 text-sm mt-0.5">{branches.length} location{branches.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
          ))}
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <GitBranch className="w-12 h-12 text-slate-700" />
          <p className="text-slate-500">No branches yet. Add your first location.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        >
          {branches.map(branch => (
            <motion.div
              key={branch._id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="bg-dark-800 border border-slate-700/40 rounded-2xl p-5
                         hover:border-slate-600/60 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center
                                justify-center border border-primary-500/20">
                  <GitBranch className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(branch)}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400
                               hover:text-slate-200 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(branch._id)}
                    disabled={deleting === branch._id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400
                               hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-display font-bold text-slate-100 text-base mb-3">{branch.name}</h3>

              <div className="space-y-1.5">
                {branch.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span>{branch.phone}</span>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{branch.email}</span>
                  </div>
                )}
              </div>

              {/* Floor Plan Toggle */}
              <div className="mt-3 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs text-slate-400 font-medium">Floor Plan</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                    ${branch.hasFloorPlan !== false
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-slate-700/60 text-slate-500'}`}>
                    {branch.hasFloorPlan !== false ? 'Tables' : 'Register'}
                  </span>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => handleToggleFloorPlan(branch)}
                  className={`relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0
                    ${branch.hasFloorPlan !== false ? 'bg-emerald-500' : 'bg-slate-600'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200
                    ${branch.hasFloorPlan !== false ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium
                                 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20
                                 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
                <div className="flex items-center gap-2">
                  {/* Customer Display button — only for register-only branches */}
                  {branch.hasFloorPlan === false && (
                    <button
                      onClick={() => window.open('/customer', '_blank')}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold
                                 bg-slate-700/60 text-slate-300 border border-slate-600/40
                                 hover:bg-slate-700 transition-all duration-150"
                      title="Open Customer Display"
                    >
                      <LayoutGrid className="w-3 h-3 text-primary-400" />
                      Customer Display
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenSession(branch)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                               bg-primary-500/15 text-primary-400 border border-primary-500/25
                               hover:bg-primary-500/25 transition-all duration-150"
                  >
                    <MonitorPlay className="w-3.5 h-3.5" />
                    Open Session
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <BranchModal
            branch={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
