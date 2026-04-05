import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Food', 'Beverage', 'Dessert', 'Snack', 'Other'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function ProductGrid({ onAddToCart }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const fetchProducts = () => {
    api.get('/products?available=true')
      .then(({ data }) => setProducts(data.products))
      .catch(() => toast.error('Failed to load products'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
    // Re-sync when user switches back to this tab (admin may have updated extras)
    const onFocus = () => api.get('/products?available=true')
      .then(({ data }) => setProducts(data.products))
      .catch(() => {});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => document.removeEventListener('visibilitychange', onFocus);
  }, []);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search + Category tabs */}
      <div className="p-4 border-b border-slate-700/50 space-y-3 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="input pl-9 text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150
                ${activeCategory === cat
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                  : 'bg-dark-700 text-slate-400 hover:text-slate-200 hover:bg-dark-700/80'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-dark-700 h-32 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Package className="w-10 h-10 text-slate-600" />
            <p className="text-slate-500 text-sm">No products found</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search}
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {filtered.map(p => (
                <motion.div key={p._id} variants={item}>
                  <ProductCard product={p} onAdd={onAddToCart} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}