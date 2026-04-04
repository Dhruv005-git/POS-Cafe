import express from 'express';
import Table from '../models/Table.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/tables — all active tables, optional floorId filter
router.get('/', protect, async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.floorId) filter.floorId = req.query.floorId;

    const tables = await Table.find(filter)
      .populate('currentOrder', 'orderNumber total status')
      .populate('floorId', 'name')
      .sort({ number: 1 });
    res.json({ tables });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tables — create single table (admin only)
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ table });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/tables/:id — update single table
router.put('/:id', protect, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({ table });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/tables/:id — admin only
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json({ message: 'Table deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tables/duplicate/:id — duplicate single table (admin)
router.post('/duplicate/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const source = await Table.findById(req.params.id);
    if (!source) return res.status(404).json({ message: 'Table not found' });

    // Find max number of tables in same floor to assign next number
    const siblings = await Table.find({ floorId: source.floorId }).sort({ number: -1 }).limit(1);
    const nextNumber = siblings.length > 0 ? siblings[0].number + 1 : source.number + 1;

    const newTable = await Table.create({
      number: nextNumber,
      floor: source.floor,
      floorId: source.floorId,
      seats: source.seats,
      status: 'available',
      isActive: true,
    });
    res.status(201).json({ table: newTable });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/tables/bulk-delete — delete multiple tables (admin)
router.post('/bulk-delete', protect, requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    await Table.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${ids.length} table(s) deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/tables/bulk-duplicate — duplicate multiple tables (admin)
router.post('/bulk-duplicate', protect, requireRole('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ids array is required' });
    }
    const sources = await Table.find({ _id: { $in: ids } });
    const newTables = [];

    for (const source of sources) {
      const siblings = await Table.find({ floorId: source.floorId }).sort({ number: -1 }).limit(1);
      const nextNumber = siblings.length > 0 ? siblings[0].number + 1 : source.number + 1;

      const created = await Table.create({
        number: nextNumber,
        floor: source.floor,
        floorId: source.floorId,
        seats: source.seats,
        status: 'available',
        isActive: true,
      });
      newTables.push(created);
    }

    res.status(201).json({ tables: newTables, count: newTables.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;