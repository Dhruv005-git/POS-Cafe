import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag, Plus, Pencil, Trash2, Check, X, Package, ChevronUp, ChevronDown,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

// ── Color palette ─────────────────────────────────────────────────────────────
const PALETTE = [
  { key: 'orange',  label: 'Orange',  classes: 'text-orange-400 bg-orange-500/15 border-orange-500/30'  },
  { key: 'blue',    label: 'Blue',    classes: 'text-blue-400 bg-blue-500/15 border-blue-500/30'        },
  { key: 'pink',    label: 'Pink',    classes: 'text-pink-400 bg-pink-500/15 border-pink-500/30'        },
  { key: 'amber',   label: 'Amber',   classes: 'text-amber-400 bg-amber-500/15 border-amber-500/30'    },
  { key: 'emerald', label: 'Green',   classes: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
  { key: 'purple',  label: 'Purple',  classes: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
  { key: 'rose',    label: 'Rose',    classes: 'text-rose-400 bg-rose-500/15 border-rose-500/30'        },
  { key: 'cyan',    label: 'Cyan',    classes: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30'        },
  { key: 'slate',   label: 'Slate',   classes: 'text-slate-400 bg-slate-500/15 border-slate-500/30'    },
];

const colorClass = (key) => PALETTE.find(p => p.key === key)?.classes || PALETTE.at(-1).classes;

const COMMON_EMOJIS = ['🍽️','🥤','🍟','🍮','📦','☕','🍱','🥗','🍰','🧁','🍣','🥩','🍛','🥪','🍹'];

// ── Inline Edit Row ───────────────────────────────────────────────────────────
function EditRow({ cat, onSave, onCancel }) {
  const [name, setName]   = useState(cat.name);
  const [emoji, setEmoji] = useState(cat.emoji);
  const [color, setColor] = useState(cat.color);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await api.put(`/categories/${cat._id}`, { name: name.trim(), emoji, color });
      onSave(data.category);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-dark-700/60 border border-primary-500/30 rounded-2xl p-4 space-y-3"
    >
      {/* Name */}
      <div className="flex items-center gap-2">
        <input
          className="input flex-1 text-sm"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Category name"
          autoFocus
          onKeyDown={e => e.key === 'Enter' && save()}
        />
      </div>

      {/* Emoji picker */}
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Emoji</p>
        <div className="flex flex-wrap gap-1">
          {COMMON_EMOJIS.map(em => (
            <button
              key={em} type="button"
              onClick={() => setEmoji(em)}
              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all
                ${emoji === em ? 'bg-primary-500/25 ring-1 ring-primary-500/50 scale-110' : 'hover:bg-slate-700/60'}`}
            >{em}</button>
          ))}
          <input
            className="w-10 h-8 text-center rounded-lg bg-dark-800 border border-slate-700/50 text-slate-200 text-sm"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={2}
          />
        </div>
      </div>

      {/* Color picker */}
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map(p => (
            <button
              key={p.key} type="button"
              onClick={() => setColor(p.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
                ${color === p.key ? `${p.classes} ring-2 ring-current ring-opacity-30` : 'border-slate-700/50 text-slate-500 hover:border-slate-600'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${colorClass(color)}`}>
        {emoji} {name || 'Preview'}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500/20 text-primary-400
                     border border-primary-500/40 hover:bg-primary-500/30 text-sm font-semibold transition-all disabled:opacity-50"
        >
          {saving ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-400 border border-slate-700/50 hover:border-slate-600 text-sm transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── New Category Form ─────────────────────────────────────────────────────────
function NewCategoryForm({ onCreated, onCancel }) {
  const [name, setName]   = useState('');
  const [emoji, setEmoji] = useState('📦');
  const [color, setColor] = useState('slate');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await api.post('/categories', { name: name.trim(), emoji, color });
      onCreated(data.category);
      toast.success(`Category "${data.category.name}" created`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally { setSaving(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-dark-800 border border-primary-500/30 rounded-2xl p-5 space-y-4"
    >
      <p className="text-sm font-semibold text-slate-200 flex items-center gap-2">
        <Plus className="w-4 h-4 text-primary-400" /> New Category
      </p>

      {/* Name */}
      <input
        className="input w-full text-sm"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="e.g. Breakfast, Combo, Mocktails…"
        autoFocus
        onKeyDown={e => e.key === 'Enter' && save()}
      />

      {/* Emoji */}
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Emoji</p>
        <div className="flex flex-wrap gap-1">
          {COMMON_EMOJIS.map(em => (
            <button
              key={em} type="button"
              onClick={() => setEmoji(em)}
              className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all
                ${emoji === em ? 'bg-primary-500/25 ring-1 ring-primary-500/50 scale-110' : 'hover:bg-slate-700/60'}`}
            >{em}</button>
          ))}
          <input
            className="w-10 h-8 text-center rounded-lg bg-dark-700 border border-slate-700/50 text-slate-200 text-sm"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={2}
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <p className="text-xs text-slate-500 mb-1.5">Color</p>
        <div className="flex flex-wrap gap-1.5">
          {PALETTE.map(p => (
            <button
              key={p.key} type="button"
              onClick={() => setColor(p.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all
                ${color === p.key ? `${p.classes} ring-2 ring-current ring-opacity-30` : 'border-slate-700/50 text-slate-500 hover:border-slate-600'}`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${colorClass(color)}`}>
        {emoji} {name || 'Preview'}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white
                     font-semibold text-sm hover:bg-primary-600 transition-all disabled:opacity-50"
        >
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Create
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-400 border border-slate-700/50 hover:border-slate-600 text-sm transition-all"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showNew, setShowNew]       = useState(false);
  const [editing, setEditing]       = useState(null);   // category _id
  const [expanded, setExpanded]     = useState(null);   // category name
  const [deleting, setDeleting]     = useState(null);   // category _id

  const fetchData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        api.get('/categories'),
        api.get('/products'),
      ]);
      setCategories(catRes.data.categories);
      setProducts(prodRes.data.products);
    } catch {
      toast.error('Failed to load categories');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreated = (cat) => {
    setCategories(prev => [...prev, cat]);
    setShowNew(false);
  };

  const handleSaved = (cat) => {
    setCategories(prev => prev.map(c => c._id === cat._id ? cat : c));
    setEditing(null);
  };

  const handleDelete = async (cat) => {
    setDeleting(cat._id);
    try {
      await api.delete(`/categories/${cat._id}`);
      setCategories(prev => prev.filter(c => c._id !== cat._id));
      toast.success(`"${cat.name}" deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally { setDeleting(null); }
  };

  // Stats per category
  const statsFor = (catName) => {
    const items = products.filter(p => p.category === catName);
    const available = items.filter(p => p.isAvailable).length;
    const avgPrice  = items.length ? items.reduce((s, p) => s + p.price, 0) / items.length : 0;
    return { total: items.length, available, avgPrice, items };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">Categories</h1>
          <p className="text-slate-500 text-sm mt-0.5">{categories.length} categories · {products.length} products</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowNew(true); setEditing(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white
                     font-semibold text-sm hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> Add Category
        </motion.button>
      </div>

      {/* New category form */}
      <AnimatePresence>
        {showNew && (
          <NewCategoryForm
            onCreated={handleCreated}
            onCancel={() => setShowNew(false)}
          />
        )}
      </AnimatePresence>

      {/* Category list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-slate-600">
          <Package className="w-12 h-12 mx-auto mb-3" />
          <p>No categories yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(cat => {
            const { total, available, avgPrice, items } = statsFor(cat.name);
            const isEditing  = editing === cat._id;
            const isExpanded = expanded === cat.name;
            const isDeleting = deleting === cat._id;

            return (
              <motion.div
                key={cat._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dark-800 border border-slate-700/40 rounded-2xl overflow-hidden"
              >
                {/* Card top row */}
                {!isEditing ? (
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Badge */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border flex-shrink-0 ${colorClass(cat.color)}`}>
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm flex-1 min-w-0">
                      <div className="text-center">
                        <p className="font-display font-bold text-xl text-slate-100">{total}</p>
                        <p className="text-xs text-slate-600">products</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-400">{available}</p>
                        <p className="text-xs text-slate-600">available</p>
                      </div>
                      {total > 0 && (
                        <div className="text-center">
                          <p className="font-semibold text-primary-400">₹{avgPrice.toFixed(0)}</p>
                          <p className="text-xs text-slate-600">avg price</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : cat.name)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                                   hover:bg-slate-700/50 hover:text-slate-300 transition-all"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { setEditing(cat._id); setShowNew(false); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                                   hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        disabled={isDeleting || total > 0}
                        title={total > 0 ? `${total} products still use this category` : 'Delete category'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                                   hover:bg-red-500/10 hover:text-red-400 transition-all
                                   disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isDeleting
                          ? <span className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <AnimatePresence>
                      <EditRow
                        cat={cat}
                        onSave={handleSaved}
                        onCancel={() => setEditing(null)}
                      />
                    </AnimatePresence>
                  </div>
                )}

                {/* Expanded products list */}
                <AnimatePresence>
                  {isExpanded && !isEditing && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-700/30 divide-y divide-slate-700/20">
                        {items.length === 0 ? (
                          <p className="px-5 py-4 text-sm text-slate-600 italic">No products in this category</p>
                        ) : items.map(p => (
                          <div key={p._id} className="flex items-center gap-3 px-5 py-3">
                            <span className="text-xl">{p.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-200 truncate">{p.name}</p>
                              <p className="text-xs text-slate-600 truncate">{p.description}</p>
                            </div>
                            <span className="font-bold text-primary-400 text-sm flex-shrink-0">₹{p.price}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0
                              ${p.isAvailable
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-slate-500 bg-slate-700/30 border-slate-600/30'}`}>
                              {p.isAvailable ? 'Available' : 'Off'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
