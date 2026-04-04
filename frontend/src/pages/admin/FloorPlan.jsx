import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid, Plus, Trash2, Copy, ChevronDown, ChevronRight,
  Users, CheckSquare, Square, X, Check, Layers,
} from 'lucide-react';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';

// ── Add Floor Modal ──────────────────────────────────────────────────────────
function AddFloorModal({ branches, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post('/floors', { name: name.trim(), branchId: branchId || null });
      onCreated(data.floor);
      toast.success(`Floor "${name}" created with 5 default tables`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create floor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-slate-100">New Floor</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Floor Name *</label>
            <input className="input" placeholder="Ground Floor" value={name}
              onChange={e => setName(e.target.value)} required autoFocus />
          </div>

          {branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Branch (optional)</label>
              <select className="input" value={branchId} onChange={e => setBranchId(e.target.value)}>
                <option value="">No branch</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <p className="text-xs text-slate-500 bg-dark-900 px-3 py-2 rounded-lg border border-slate-700/40">
            💡 5 default tables will be automatically created for this floor.
          </p>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400
                         border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Floor
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Add Table Modal ──────────────────────────────────────────────────────────
function AddTableModal({ floor, tables, onClose, onCreated }) {
  const maxNum = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
  const [seats, setSeats] = useState(4);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/tables', {
        number: maxNum + 1,
        floor: floor.name,
        floorId: floor._id,
        seats: Number(seats),
        status: 'available',
        isActive: true,
      });
      onCreated(data.table);
      toast.success(`Table ${maxNum + 1} added`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add table');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-dark-800 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-slate-100">Add Table</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Table Number</label>
            <input className="input bg-dark-900 text-slate-500" value={`T${maxNum + 1}`} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Seats</label>
            <div className="flex gap-2">
              {[2, 4, 6, 8].map(n => (
                <button key={n} type="button" onClick={() => setSeats(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all
                    ${seats === n
                      ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                      : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                    }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400
                         border border-slate-700/50 hover:bg-slate-700/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Table
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Table Card ───────────────────────────────────────────────────────────────
function TableCard({ table, selected, onSelect, onDuplicate, onDelete, selectionMode }) {
  return (
    <motion.div
      layout
      variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
      className={`relative bg-dark-800 border rounded-2xl p-4 cursor-pointer
                  transition-all duration-200 group
                  ${selected
                    ? 'border-primary-500/60 bg-primary-500/10 ring-2 ring-primary-500/30'
                    : 'border-slate-700/40 hover:border-slate-600/60'
                  }`}
      onClick={() => selectionMode && onSelect(table._id)}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <button onClick={e => { e.stopPropagation(); onSelect(table._id); }}
          className="absolute top-2 left-2">
          {selected
            ? <CheckSquare className="w-4 h-4 text-primary-400" />
            : <Square className="w-4 h-4 text-slate-600" />}
        </button>
      )}

      {/* Actions — hover only */}
      {!selectionMode && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onDuplicate(table._id); }}
            className="p-1 rounded-lg bg-dark-700 hover:bg-dark-600 text-slate-400 hover:text-slate-200 transition-colors">
            <Copy className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(table._id); }}
            className="p-1 rounded-lg bg-dark-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="text-center mt-1">
        <div className="text-2xl mb-1">🪑</div>
        <p className="font-display font-bold text-slate-100 text-lg">T{table.number}</p>
        <p className="text-xs text-slate-500 flex items-center justify-center gap-1 mt-0.5">
          <Users className="w-3 h-3" /> {table.seats} seats
        </p>
        <div className={`mt-2 text-xs px-2 py-0.5 rounded-full inline-block font-medium
          ${table.status === 'available'
            ? 'bg-emerald-500/15 text-emerald-400'
            : table.status === 'occupied'
              ? 'bg-amber-500/15 text-amber-400'
              : 'bg-red-500/15 text-red-400'
          }`}>
          {table.status}
        </div>
      </div>
    </motion.div>
  );
}

// ── Floor Section ────────────────────────────────────────────────────────────
function FloorSection({ floor, onFloorDeleted }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [modal, setModal] = useState(null); // null | 'add-table'

  const fetchTables = useCallback(async () => {
    try {
      const { data } = await api.get(`/tables?floorId=${floor._id}`);
      setTables(data.tables);
    } catch {
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, [floor._id]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleAddTable = (table) => {
    setTables(prev => [...prev, table]);
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await api.post(`/tables/duplicate/${id}`);
      setTables(prev => [...prev, data.table]);
      toast.success('Table duplicated');
    } catch {
      toast.error('Failed to duplicate table');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      setTables(prev => prev.filter(t => t._id !== id));
      toast.success('Table deleted');
    } catch {
      toast.error('Failed to delete table');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.length} table(s)?`)) return;
    try {
      await api.post('/tables/bulk-delete', { ids: selected });
      setTables(prev => prev.filter(t => !selected.includes(t._id)));
      setSelected([]);
      setSelectionMode(false);
      toast.success(`${selected.length} table(s) deleted`);
    } catch {
      toast.error('Failed to bulk delete');
    }
  };

  const handleBulkDuplicate = async () => {
    try {
      const { data } = await api.post('/tables/bulk-duplicate', { ids: selected });
      setTables(prev => [...prev, ...data.tables]);
      setSelected([]);
      setSelectionMode(false);
      toast.success(`${data.count} table(s) duplicated`);
    } catch {
      toast.error('Failed to bulk duplicate');
    }
  };

  const handleDeleteFloor = async () => {
    if (!window.confirm(`Delete floor "${floor.name}" and all its tables?`)) return;
    try {
      await api.delete(`/floors/${floor._id}`);
      onFloorDeleted(floor._id);
      toast.success('Floor deleted');
    } catch {
      toast.error('Failed to delete floor');
    }
  };

  return (
    <div className="bg-dark-800 border border-slate-700/40 rounded-2xl overflow-hidden">
      {/* Floor header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-primary-500/15 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary-400" />
          </div>
          <div>
            <p className="font-display font-semibold text-slate-100">{floor.name}</p>
            <p className="text-xs text-slate-500">{tables.length} table{tables.length !== 1 ? 's' : ''}</p>
          </div>
          {expanded
            ? <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
            : <ChevronRight className="w-4 h-4 text-slate-500 ml-1" />}
        </button>

        <div className="flex items-center gap-2">
          {/* Bulk mode toggle */}
          <button
            onClick={() => { setSelectionMode(s => !s); setSelected([]); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                        border transition-all duration-200
              ${selectionMode
                ? 'bg-primary-500/20 text-primary-400 border-primary-500/40'
                : 'text-slate-400 border-slate-700/50 hover:border-slate-600'
              }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {selectionMode ? 'Cancel Select' : 'Select'}
          </button>

          {/* Bulk actions (when in selection mode and items selected) */}
          {selectionMode && selected.length > 0 && (
            <>
              <button onClick={handleBulkDuplicate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                           bg-emerald-500/10 text-emerald-400 border border-emerald-500/30
                           hover:bg-emerald-500/20 transition-colors">
                <Copy className="w-3.5 h-3.5" /> Duplicate {selected.length}
              </button>
              <button onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                           bg-red-500/10 text-red-400 border border-red-500/30
                           hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete {selected.length}
              </button>
            </>
          )}

          {!selectionMode && (
            <>
              <button onClick={() => setModal('add-table')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                           bg-primary-500/10 text-primary-400 border border-primary-500/25
                           hover:bg-primary-500/20 transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Table
              </button>
              <button onClick={handleDeleteFloor}
                className="p-1.5 rounded-xl text-slate-500 hover:text-red-400
                           hover:bg-red-500/10 transition-colors border border-transparent
                           hover:border-red-500/30">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tables grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">
              {loading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-dark-700 animate-pulse" />
                  ))}
                </div>
              ) : tables.length === 0 ? (
                <div className="text-center py-8 text-slate-600">
                  <p>No tables. Click "Add Table" to add one.</p>
                </div>
              ) : (
                <motion.div
                  className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
                  initial="hidden" animate="show"
                >
                  {tables.map(table => (
                    <TableCard
                      key={table._id}
                      table={table}
                      selected={selected.includes(table._id)}
                      onSelect={toggleSelect}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      selectionMode={selectionMode}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Table Modal */}
      <AnimatePresence>
        {modal === 'add-table' && (
          <AddTableModal
            floor={floor}
            tables={tables}
            onClose={() => setModal(null)}
            onCreated={handleAddTable}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Floor Plan Page ─────────────────────────────────────────────────────
export default function FloorPlan() {
  const [floors, setFloors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [floorsRes, branchesRes] = await Promise.all([
        api.get('/floors'),
        api.get('/branches'),
      ]);
      setFloors(floorsRes.data.floors);
      setBranches(branchesRes.data.branches);
    } catch {
      toast.error('Failed to load floor plan data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFloorCreated = (floor) => {
    setFloors(prev => [...prev, floor]);
  };

  const handleFloorDeleted = (floorId) => {
    setFloors(prev => prev.filter(f => f._id !== floorId));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-100">Floor Plan</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {floors.length} floor{floors.length !== 1 ? 's' : ''} · Manage tables and seating
          </p>
        </div>
        <button onClick={() => setModal('add-floor')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Floor
        </button>
      </div>

      {/* Floors */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-dark-800 animate-pulse border border-slate-700/30" />
          ))}
        </div>
      ) : floors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LayoutGrid className="w-16 h-16 text-slate-700" />
          <p className="text-slate-500 text-lg">No floors yet</p>
          <p className="text-slate-600 text-sm">Create a floor to start adding tables</p>
          <button onClick={() => setModal('add-floor')} className="btn-primary flex items-center gap-2 mt-2">
            <Plus className="w-4 h-4" /> Create First Floor
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {floors.map(floor => (
            <FloorSection
              key={floor._id}
              floor={floor}
              onFloorDeleted={handleFloorDeleted}
            />
          ))}
        </div>
      )}

      {/* Add Floor Modal */}
      <AnimatePresence>
        {modal === 'add-floor' && (
          <AddFloorModal
            branches={branches}
            onClose={() => setModal(null)}
            onCreated={handleFloorCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
