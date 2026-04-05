import express from 'express';
import Session from '../models/Session.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ── GET /api/sessions/current?branchId=xxx
// Returns the active open session for a branch (or global if no branchId)
router.get('/current', protect, async (req, res) => {
  try {
    const filter = { status: 'open' };
    if (req.query.branchId) filter.branchId = req.query.branchId;

    const session = await Session.findOne(filter)
      .populate('openedBy', 'name role')
      .populate('branchId', 'name');
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /api/sessions/open  { openingCash, branchId }
router.post('/open', protect, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
  try {
    const { openingCash = 0, branchId } = req.body;

    // Check if this branch already has an open session
    const filter = { status: 'open' };
    if (branchId) filter.branchId = branchId;
    const existing = await Session.findOne(filter);
    if (existing) {
      // Return the existing session — staff can re-join mid-shift
      return res.json({ session: existing, resumed: true });
    }

    const session = await Session.create({
      branchId: branchId || null,
      openedBy: req.user._id,
      openingCash,
    });

    res.status(201).json({ session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /api/sessions/:id/close  { closingCash }
router.put('/:id/close', protect, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
  try {
    const { closingCash = 0 } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'closed') return res.status(400).json({ message: 'Session already closed' });

    // cashSales and totalSales are already live-tracked by the pay route.
    // Just record the closing cash and timestamps.
    session.closingCash = parseFloat(Number(closingCash).toFixed(2));
    session.status      = 'closed';
    session.closedAt    = new Date();
    await session.save();

    res.json({ session: session.toJSON() });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GET /api/sessions — admin: list all sessions
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('openedBy', 'name')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;