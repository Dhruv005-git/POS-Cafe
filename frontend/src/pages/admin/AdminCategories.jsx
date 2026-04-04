import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tag, TrendingUp } from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Beverage', 'Dessert', 'Snack', 'Other'];
const COLORS = {
  Food: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
  Beverage: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
  Dessert: 'text-pink-400 bg-pink-500/10 border-pink-500/25',
  Snack: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
  Other: 'text-slate-400 bg-slate-500/10 border-slate-500/25',
};

export default function AdminCategories() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

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

  const stats = CATEGORIES.map(cat => {
    const items = products.filter(p => p.category === cat);
    const available = items.filter(p => p.isAvailable).length;
    const avgPrice = items.length ? items.reduce((s, p) => s + p.price, 0) / items.length : 0;
    return { cat, total: items.length, available, avgPrice, items };
  });

  const displayProducts = selected
    ? products.filter(p => p.category === selected)
    : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-100">Categories</h1>
        <p className="text-slate-500 text-sm mt-0.5">Product distribution by category</p>
      </div>

      {/* Category cards */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map(({ cat, total, available, avgPrice }) => (
            <motion.button
              key={cat}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelected(selected === cat ? null : cat)}
              className={`p-4 rounded-2xl border text-left transition-all duration-200
                ${selected === cat
                  ? `${COLORS[cat]} ring-2 ring-current ring-opacity-30`
                  : 'bg-dark-800 border-slate-700/40 hover:border-slate-600/60'
                }`}
            >
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                              font-semibold border mb-3 ${COLORS[cat]}`}>
                <Tag className="w-3 h-3" /> {cat}
              </div>
              <p className="font-display font-bold text-2xl text-slate-100">{total}</p>
              <p className="text-xs text-slate-500 mb-2">products</p>
              <div className="text-xs text-slate-600 space-y-0.5">
                <p>{available} available</p>
                <p>avg ${avgPrice.toFixed(2)}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Selected category product list */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-800 border border-slate-700/40 rounded-2xl overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-200">{selected}</span>
            <span className="text-xs text-slate-500">— {displayProducts.length} products</span>
          </div>
          <div className="divide-y divide-slate-700/20">
            {displayProducts.map(p => (
              <div key={p._id} className="flex items-center gap-4 px-5 py-3">
                <span className="text-2xl">{p.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.description}</p>
                </div>
                <span className="font-bold text-primary-400">${p.price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium
                  ${p.isAvailable
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : 'text-slate-500 bg-slate-700/30 border-slate-600/30'
                  }`}>
                  {p.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
