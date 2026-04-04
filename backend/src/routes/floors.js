import express from 'express';
import Floor from '../models/Floor.js';
import Table from '../models/Table.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/floors — admin only, with table count
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const floors = await Floor.find({ isActive: true })
      .populate('branchId', 'name')
      .sort({ createdAt: 1 });

    // Attach table count to each floor
    const floorsWithCount = await Promise.all(
      floors.map(async (floor) => {
        const tableCount = await Table.countDocuments({ floorId: floor._id, isActive: true });
        return { ...floor.toObject(), tableCount };
      })
    );

    res.json({ floors: floorsWithCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/floors — admin only, auto-creates 5 default tables
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, branchId } = req.body;
    if (!name) return res.status(400).json({ message: 'Floor name is required' });

    const floor = await Floor.create({ name, branchId: branchId || null });

    // Auto-create 5 tables for this new floor
    const defaultTables = Array.from({ length: 5 }, (_, i) => ({
      number: i + 1,
      floor: name,
      floorId: floor._id,
      seats: 4,
      status: 'available',
      isActive: true,
    }));
    await Table.insertMany(defaultTables);

    res.status(201).json({ floor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/floors/:id — admin only
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const floor = await Floor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!floor) return res.status(404).json({ message: 'Floor not found' });
    res.json({ floor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/floors/:id — admin only (soft-deletes the floor and its tables)
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) return res.status(404).json({ message: 'Floor not found' });

    // Soft-delete tables belonging to this floor
    await Table.updateMany({ floorId: floor._id }, { isActive: false });

    await Floor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Floor and its tables deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
