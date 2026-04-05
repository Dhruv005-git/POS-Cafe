import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, RefreshCw, Layers, Wifi, WifiOff,
  Building2, MapPin, ArrowRight,
} from 'lucide-react';
import TableCard from './TableCard.jsx';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { useSocketEvent, useSocketConnected } from '../../hooks/useSocket.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSession } from '../../hooks/useSession.js';
import OpeningBalanceModal from './OpeningBalanceModal.jsx';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } };

// ── Branch Selector Screen ───────────────────────────────────────────────────
function BranchSelector({ onSelect }) {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/branches')
      .then(({ data }) => setBranches(data.branches))
      .catch(() => toast.error('Could not load branches'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary-500/20">
            <Building2 className="w-8 h-8 text-primary-400" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-100 mb-2">Select Your Branch</h1>
          <p className="text-slate-500 text-sm">Choose the branch you're working at today</p>
        </div>

        {/* Branch cards */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p>No branches found.</p>
            <p className="text-xs mt-1">Ask an admin to create a branch first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {branches.map((branch, i) => (
              <motion.button
                key={branch._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => onSelect(branch)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl
                           bg-dark-800 border border-slate-700/40
                           hover:border-primary-500/40 hover:bg-primary-500/5
                           transition-all duration-200 group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary-500/15 flex items-center justify-center flex-shrink-0
                                group-hover:bg-primary-500/25 transition-colors border border-primary-500/20">
                  <Building2 className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{branch.name}</p>
                  {branch.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {branch.address}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Main FloorView ───────────────────────────────────────────────────────────
export default function FloorView() {
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const connected = useSocketConnected();
  const { selectedBranch, setSelectedBranch } = useAuth();
  const { session, loading: sessionLoading, opening, openSession } = useSession(selectedBranch?._id);

  const fetchTablesAndFloors = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      if (selectedBranch) {
        // Step 1: load floors for this branch
        const { data: floorData } = await api.get(`/floors?branchId=${selectedBranch._id}`);
        const branchFloors = floorData.floors || [];
        setFloors(branchFloors);

        if (branchFloors.length === 0) {
          setTables([]);
          return;
        }

        // Step 2: fetch tables for each floor by floorId (floorId IS reliably stored on tables)
        const tableResults = await Promise.all(
          branchFloors.map(f => api.get(`/tables?floorId=${f._id}`))
        );
        const allTables = tableResults.flatMap(r => r.data.tables);
        setTables(allTables);
      } else {
        // No branch selected — load all tables (fallback)
        const { data } = await api.get('/tables');
        setTables(data.tables);
      }
    } catch {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch]);

  useEffect(() => { fetchTablesAndFloors(); }, [fetchTablesAndFloors]);

  useSocketEvent('new_order', () => fetchTablesAndFloors(true));
  useSocketEvent('payment_done', () => fetchTablesAndFloors(true));
  useSocketEvent('order_update', () => fetchTablesAndFloors(true));

  // If no branch selected, show branch selector
  if (!selectedBranch) {
    return <BranchSelector onSelect={(b) => setSelectedBranch(b)} />;
  }

  // If session check is loading, show spinner (applies to both floor + register branches)
  if (sessionLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  // No active session → show Opening Balance Modal for BOTH floor-plan and register branches
  if (!session) {
    return (
      <OpeningBalanceModal
        branchName={selectedBranch?.name}
        onOpen={openSession}
        opening={opening}
      />
    );
  }

  // Register-only branches (no floor plan) → redirect to register now that session is open
  if (selectedBranch.hasFloorPlan === false) {
    navigate('/pos/register', { replace: true });
    return null;
  }

  // Group tables by floor name
  const floorNames = [...new Set(tables.map(t => t.floor))];
  const stats = {
    available: tables.filter(t => t.status === 'available').length,
    occupied:  tables.filter(t => t.status === 'occupied').length,
    reserved:  tables.filter(t => t.status === 'reserved').length,
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
            {/* Branch indicator */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3 h-3 text-primary-400" />
              <span className="text-xs text-primary-400 font-medium">{selectedBranch.name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
            ${connected
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {connected
              ? <><Wifi className="w-3 h-3" /> Live</>
              : <><WifiOff className="w-3 h-3" /> Offline</>}
          </div>
          <button onClick={() => fetchTablesAndFloors()} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-6">
        {[
          { label: 'Available', count: stats.available, cls: 'text-emerald-400' },
          { label: 'Occupied',  count: stats.occupied,  cls: 'text-accent-400'  },
          { label: 'Reserved',  count: stats.reserved,  cls: 'text-red-400'     },
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
          <p className="text-slate-500">No tables found for this branch.</p>
          <p className="text-xs text-slate-600">Ask an admin to add floors and tables in the Floor Plan.</p>
        </div>
      ) : (
        floorNames.map(floor => (
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