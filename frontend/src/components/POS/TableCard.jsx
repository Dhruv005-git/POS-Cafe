import { motion } from 'framer-motion';
import { Users, Clock } from 'lucide-react';

const statusConfig = {
  available: {
    border: 'border-emerald-500/40 hover:border-emerald-500/80',
    bg: 'bg-emerald-500/5',
    glow: 'hover:shadow-emerald-500/10',
    dot: 'bg-emerald-400',
    label: 'Available',
    labelClass: 'badge-success',
  },
  occupied: {
    border: 'border-accent-500/40 hover:border-accent-500/80',
    bg: 'bg-accent-500/5',
    glow: 'hover:shadow-accent-500/10',
    dot: 'bg-accent-400',
    label: 'Occupied',
    labelClass: 'badge-warning',
  },
  reserved: {
    border: 'border-red-500/40 hover:border-red-500/80',
    bg: 'bg-red-500/5',
    glow: 'hover:shadow-red-500/10',
    dot: 'bg-red-400',
    label: 'Reserved',
    labelClass: 'badge-danger',
  },
};

export default function TableCard({ table, onClick }) {
  const cfg = statusConfig[table.status] || statusConfig.available;

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        w-full aspect-square rounded-2xl border-2 ${cfg.border} ${cfg.bg}
        bg-dark-800 p-4 flex flex-col items-center justify-center gap-2
        cursor-pointer transition-all duration-200 shadow-lg ${cfg.glow} hover:shadow-xl
        relative overflow-hidden
      `}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-2xl" />

      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} animate-pulse`} />

      <span className="font-display font-bold text-3xl text-slate-100">
        {table.number}
      </span>
      <span className="text-xs text-slate-500 font-medium uppercase tracking-widest">Table</span>

      <div className="flex items-center gap-1.5 mt-1">
        <Users className="w-3 h-3 text-slate-500" />
        <span className="text-xs text-slate-500">{table.seats} seats</span>
      </div>

      <span className={`${cfg.labelClass} badge text-[10px] mt-1`}>{cfg.label}</span>

      {table.currentOrder && (
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3 text-accent-400" />
          <span className="text-[10px] text-accent-400 font-medium">
            {table.currentOrder.orderNumber}
          </span>
        </div>
      )}
    </motion.button>
  );
}