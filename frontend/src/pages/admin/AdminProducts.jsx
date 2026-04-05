import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Package, Search,
  X, Check, ToggleLeft, ToggleRight, Sparkles,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const EMOJIS = ['🍕','🍝','🍔','🥗','🍟','🥖','☕','🍋','🍫','🍰','🥭','🍣','🍜','🥩','🧁','🍦','🥤','🫖','🍵','🍱'];

const emptyForm = {
  name: '', category: 'Food', price: '', emoji: '🍽️',
  description: '', tax: 5, unit: 'plate', isAvailable: true, sendToKitchen: true,
  extras: [],
};

function ProductModal({ product, categories: categoriesFromParent, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(product || {}),
    extras: product?.extras ? [...product.extras] : [],
  }));
  const [saving, setSaving]         = useState(false);
  const [newExtraName, setNewExtraName]   = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');
  const categories = categoriesFromParent?.length > 0
    ? categoriesFromParent
    : ['Food', 'Beverage', 'Dessert', 'Snack', 'Other'];

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const addExtra = () => {
    const name = newExtraName.trim();
    const price = parseFloat(newExtraPrice);
    if (!name || isNaN(price) || price < 0) return;
    set('extras', [...form.extras, { name, price }]);
    setNewExtraName('');
    setNewExtraPrice('');
  };

  const removeExtra = (idx) => {
    set('extras', form.extras.filter((_, i) => i !== idx));
  };

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
        className="bg-dark-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-4"
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
                className="w-10 h-8 text-center rounded-lg bg-dark-800 border border-slate-700/50 text-slate-200 text-sm"
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
              {categories.map(cat => {
                const name = typeof cat === 'string' ? cat : cat.name;
                return (
                  <button key={name} type="button" onClick={() => set('category', name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                      ${form.category === name
                        ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                        : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                      }`}>
                    {typeof cat === 'string' ? cat : `${cat.emoji} ${cat.name}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price + Tax */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Price (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input className="input pl-7" type="number" min="0" step="0.01" placeholder="99"
                  value={form.price} onChange={e => set('price', e.target.value)} required />
              </div>
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

          {/* ── Extras Manager ────────────────────────────────────── */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Extras</span>
              <span className="text-xs text-slate-500">Add-ons staff can select per item</span>
            </div>

            {/* Existing extras list */}
            {form.extras.length > 0 && (
              <div className="space-y-1.5">
                {form.extras.map((extra, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-dark-800 rounded-xl border border-slate-700/30">
                    <span className="text-sm text-slate-200 flex-1 truncate">{extra.name}</span>
                    <span className="text-sm font-bold text-amber-400 flex-shrink-0">+₹{extra.price}</span>
                    <button type="button" onClick={() => removeExtra(idx)}
                      className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new extra row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Extra Cheese, Large Size"
                value={newExtraName}
                onChange={e => setNewExtraName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtra(); } }}
                className="input flex-1 text-sm py-2"
              />
              <div className="relative w-24 flex-shrink-0">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={newExtraPrice}
                  onChange={e => setNewExtraPrice(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtra(); } }}
                  className="input w-full pl-6 text-sm py-2"
                />
              </div>
              <button
                type="button"
                onClick={addExtra}
                disabled={!newExtraName.trim() || !newExtraPrice}
                className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30
                           hover:bg-amber-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                           flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {form.extras.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-1">
                No extras yet. Add add-ons like "Extra Cheese +₹30" or "Large Size +₹50".
              </p>
            )}
          </div>

          {/* Toggles */}
          <div className="flex gap-4">
            {[
              { key: 'isAvailable', label: 'Available' },
              { key: 'sendToKitchen', label: 'Send to Kitchen' },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => set(key, !form[key])}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition-all duration-200
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
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('all');
  const [deleting, setDeleting]     = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(prodRes.data.products);
      setCategories(catRes.data.categories || []);
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
          {['all', ...categories.map(c => c.name)].map(c => (
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
              <p className="text-xs text-slate-500 mb-1 truncate">{product.description}</p>

              {/* Extras badge */}
              {product.extras?.length > 0 && (
                <div className="flex items-center gap-1 mb-2">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-400/80 font-medium">
                    {product.extras.length} extra{product.extras.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-primary-400">₹{product.price}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-600 px-2 py-0.5 rounded-full bg-dark-700 border border-slate-700/50">
                    {product.category}
                  </span>
                  <button onClick={() => toggleAvailable(product)} className="transition-colors">
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
            categories={categories}
            onClose={() => setModal(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
