import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, RefreshCw, Layers, Wifi, WifiOff } from 'lucide-react';
import TableCard from './TableCard.jsx';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { useSocketEvent, useSocketConnected } from '../../hooks/useSocket.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } };

export default function FloorView() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const connected = useSocketConnected();

  const fetchTables = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data } = await api.get('/tables');
      setTables(data.tables);
    } catch {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // Auto-refresh floor when orders change
  useSocketEvent('new_order', () => fetchTables(true));
  useSocketEvent('payment_done', () => fetchTables(true));
  useSocketEvent('order_update', () => fetchTables(true));

  const floors = [...new Set(tables.map(t => t.floor))];
  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-slate-100">Floor View</h1>
            <p className="text-sm text-slate-500">Select a table to start an order</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Live connection badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
            ${connected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {connected
              ? <><Wifi className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> Offline</>}
          </div>
          <button onClick={() => fetchTables()} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6">
        {[
          { label: 'Available', count: stats.available, cls: 'text-emerald-400' },
          { label: 'Occupied', count: stats.occupied, cls: 'text-accent-400' },
          { label: 'Reserved', count: stats.reserved, cls: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="card px-4 py-2 flex items-center gap-2">
            <span className={`font-display font-bold text-lg ${s.cls}`}>{s.count}</span>
            <span className="text-xs text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Table grid per floor */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Layers className="w-12 h-12 text-slate-600" />
          <p className="text-slate-500">No tables found. Run the seed script to add tables.</p>
        </div>
      ) : (
        floors.map(floor => (
          <div key={floor} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">{floor}</span>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
            >
              {tables.filter(t => t.floor === floor).map(table => (
                <motion.div key={table._id} variants={item}>
                  <TableCard
                    table={table}
                    onClick={() => navigate(`/pos/order/${table._id}`, { state: { table } })}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))
      )}
    </div>
  );
}