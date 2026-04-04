import express from 'express';
import Branch from '../models/Branch.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/branches — public (for homepage dynamic display)
router.get('/', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ createdAt: 1 });
    res.json({ branches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/branches — admin only
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({ branch });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/branches/:id — admin only
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ branch });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/branches/:id — admin only
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
