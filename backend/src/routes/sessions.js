import express from 'express';
import Session from '../models/Session.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/current', protect, async (req, res) => {
  try {
    const session = await Session.findOne({ status: 'open' }).populate('openedBy', 'name role');
    res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/open', protect, async (req, res) => {
  try {
    const existing = await Session.findOne({ status: 'open' });
    if (existing) return res.status(400).json({ message: 'A session is already open' });
    const session = await Session.create({
      openedBy: req.user._id,
      openingCash: req.body.openingCash || 0,
    });
    res.status(201).json({ session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/close', protect, async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { status: 'open' },
      { status: 'closed', closedAt: new Date(), closingCash: req.body.closingCash || 0 },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: 'No open session found' });
    res.json({ session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;