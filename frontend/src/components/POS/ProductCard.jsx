import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { sound } from '../../utils/sound.js';

export default function ProductCard({ product, onAdd }) {
  const [flash, setFlash] = useState(false);
  const [pulsing, setPulsing] = useState(false); // ✅ NEW

  const handleAdd = () => {
    onAdd(product);
    sound.addItem();

    setFlash(true);
    setPulsing(true);

    setTimeout(() => setFlash(false), 600);
    setTimeout(() => setPulsing(false), 450);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      animate={flash ? { scale: [1, 1.06, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`
        card-hover p-4 flex flex-col gap-2 cursor-pointer relative overflow-hidden
        ${flash ? 'border-primary-500/60' : ''}
        ${pulsing ? 'cart-pulse' : ''} 
        transition-all duration-200
      `}
    >
      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary-500/10 rounded-xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Emoji */}
      <div className="text-3xl mb-1 select-none">{product.emoji}</div>

      {/* Product Info */}
      <div className="flex-1">
        <p className="font-semibold text-slate-100 text-sm leading-tight">
          {product.name}
        </p>
        {product.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {product.description}
          </p>
        )}
      </div>

      {/* Price + Add Button */}
      <div className="flex items-center justify-between mt-1">
        <span className="font-display font-bold text-primary-400 text-base">
          ₹{product.price.toFixed(2)}
        </span>

        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleAdd}
          className={`
            w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
            ${flash
              ? 'bg-emerald-500 text-white'
              : 'bg-primary-500/20 hover:bg-primary-500 text-primary-400 hover:text-white'}
          `}
        >
          {flash ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}