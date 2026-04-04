import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Package, Search,
  X, Check, ToggleLeft, ToggleRight,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Beverage', 'Dessert', 'Snack', 'Other'];
const EMOJIS = ['🍕','🍝','🍔','🥗','🍟','🥖','☕','🍋','🍫','🍰','🥭','🍣','🍜','🥩','🧁','🍦','🥤','🫖','🍵','🍱'];

const emptyForm = {
  name: '', category: 'Food', price: '', emoji: '🍽️',
  description: '', tax: 5, unit: 'plate', isAvailable: true, sendToKitchen: true,
};

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (product?._id) {
        const { data } = await api.put(`/products/${product._id}`, form);
        onSaved(data.product, 'updated');
      } else {
        const { data } = await api.post('/products', form);
        onSaved(data.product, 'created');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-lg
                   shadow-2xl my-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-slate-100 text-lg">
            {product?._id ? 'Edit Product' : 'New Product'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Emoji</label>
            <div className="flex flex-wrap gap-1.5 p-3 bg-dark-900 rounded-xl border border-slate-700/40">
              {EMOJIS.map(em => (
                <button key={em} type="button" onClick={() => set('emoji', em)}
                  className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-all duration-150
                    ${form.emoji === em ? 'bg-primary-500/25 ring-1 ring-primary-500/50 scale-110' : 'hover:bg-slate-700/50'}`}>
                  {em}
                </button>
              ))}
              <input
                className="w-10 h-8 text-center rounded-lg bg-dark-800 border border-slate-700/50
                           text-slate-200 text-sm"
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                maxLength={2}
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Product Name *</label>
            <input className="input" placeholder="Margherita Pizza" value={form.name}
              onChange={e => set('name', e.target.value)} required />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Category *</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => set('category', cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                    ${form.category === cat
                      ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                      : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price + Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Price ($) *</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="9.99"
                value={form.price} onChange={e => set('price', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Tax (%)</label>
              <input className="input" type="number" min="0" max="100" placeholder="5"
                value={form.tax} onChange={e => set('tax', e.target.value)} />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
            <input className="input" placeholder="Optional short description" value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            {[
              { key: 'isAvailable', label: 'Available' },
              { key: 'sendToKitchen', label: 'Send to Kitchen' },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => set(key, !form[key])}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl
                            border transition-all duration-200
                  ${form[key]
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-dark-900 text-slate-500 border-slate-700/50'
                  }`}>
                {form[key] ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400
                         border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              {product?._id ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data.products);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleSaved = (product, action) => {
    if (action === 'created') {
      setProducts(prev => [product, ...prev]);
      toast.success('Product added!');
    } else {
      setProducts(prev => prev.map(p => p._id === product._id ? product : p));
      toast.success('Product updated!');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    setDeleting(id);
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const toggleAvailable = async (product) => {
    try {
      const { data } = await api.put(`/products/${product._id}`, { isAvailable: !product.isAvailable });
      setProducts(prev => prev.map(p => p._id === product._id ? data.product : p));
    } catch {
      toast.error('Failed to update availability');
    }
  };

  const filtered = products.filter(p => {
    const matchCat = catFilter === 'all' || p.category === catFilter;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">Products</h1>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} total products</p>
        </div>
        <button onClick={() => setModal('new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input className="input pl-9 py-2 text-sm" placeholder="Search products..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                ${catFilter === c
                  ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                  : 'text-slate-500 border-slate-700/50 hover:text-slate-300'
                }`}>
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Package className="w-12 h-12 text-slate-700" />
          <p className="text-slate-500">No products found</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        >
          {filtered.map(product => (
            <motion.div
              key={product._id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className={`bg-dark-800 border rounded-2xl p-4 group transition-all duration-200
                ${product.isAvailable
                  ? 'border-slate-700/40 hover:border-slate-600/60'
                  : 'border-slate-700/20 opacity-60'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{product.emoji}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setModal(product)}
                    className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(product._id)} disabled={deleting === product._id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="font-medium text-slate-200 text-sm mb-0.5 truncate">{product.name}</h3>
              <p className="text-xs text-slate-500 mb-3 truncate">{product.description}</p>

              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-primary-400">${product.price}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600 px-2 py-0.5 rounded-full bg-dark-700 border border-slate-700/50">
                    {product.category}
                  </span>
                  <button onClick={() => toggleAvailable(product)}
                    className="transition-colors">
                    {product.isAvailable
                      ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                      : <ToggleLeft className="w-5 h-5 text-slate-600" />
                    }
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
          <ProductModal
            product={modal === 'new' ? null : modal}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
