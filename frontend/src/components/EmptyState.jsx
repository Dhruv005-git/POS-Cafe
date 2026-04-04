// frontend/src/components/EmptyState.jsx
import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-slate-700/40
                        flex items-center justify-center">
          <Icon className="w-7 h-7 text-slate-600" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display font-semibold text-slate-400 text-base">{title}</p>
        {subtitle && <p className="text-slate-600 text-sm">{subtitle}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-2 text-sm px-5 py-2"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}