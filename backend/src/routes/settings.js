import express from 'express';
import Settings from '../models/Settings.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ── GET current settings (public — used by PaymentModal for UPI QR) ──────────
router.get('/', async (req, res) => {
  try {
    // findOneAndUpdate with upsert acts as "get or create defaults"
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { $setOnInsert: { key: 'global' } },
      { upsert: true, new: true }
    );
    res.json({
      upiId:    settings.upiId    || 'cafe@upi',
      cafeName: settings.cafeName || 'POS Cafe',
      taxRate:  settings.taxRate  ?? 5,
      currency: settings.currency || 'INR',
    });
  } catch (err) {
    // Fallback to safe defaults if DB is unavailable
    res.json({ upiId: 'cafe@upi', cafeName: 'POS Cafe', taxRate: 5, currency: 'INR' });
  }
});

// ── PUT update settings (admin only) ─────────────────────────────────────────
router.put('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { upiId, cafeName, taxRate, currency } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          ...(upiId    !== undefined && { upiId }),
          ...(cafeName !== undefined && { cafeName }),
          ...(taxRate  !== undefined && { taxRate: Number(taxRate) }),
          ...(currency !== undefined && { currency }),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      upiId:    settings.upiId,
      cafeName: settings.cafeName,
      taxRate:  settings.taxRate,
      currency: settings.currency,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;