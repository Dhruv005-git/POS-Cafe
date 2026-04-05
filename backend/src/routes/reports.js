import express from 'express';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── Date helpers ──────────────────────────────────────────────────────────────
const TZ = 'Asia/Kolkata';
const startOfDay   = (d) => { const x = new Date(d); x.setHours(0,0,0,0);     return x; };
const endOfDay     = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const startOfWeek  = (d) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay()+6)%7)); x.setHours(0,0,0,0); return x; };
const startOfMonth = (d) => { const x = new Date(d); x.setDate(1);             x.setHours(0,0,0,0); return x; };

// Month name → 0-indexed month number
const MONTH_MAP = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };

function buildDateRange(period, from, to) {
  const now = new Date();

  // Custom range
  if (from && to) return { $gte: new Date(from), $lte: new Date(to) };

  // Specific month shortcodes: jan, feb, mar, apr …
  if (MONTH_MAP[period] !== undefined) {
    const yr  = now.getFullYear();
    const mon = MONTH_MAP[period];
    const s   = new Date(yr, mon, 1, 0, 0, 0, 0);
    const e   = new Date(yr, mon + 1, 0, 23, 59, 59, 999);
    return { $gte: s, $lte: e };
  }

  switch (period) {
    case 'today':      return { $gte: startOfDay(now),   $lte: endOfDay(now) };
    case 'yesterday': { const y = new Date(now); y.setDate(y.getDate()-1); return { $gte: startOfDay(y), $lte: endOfDay(y) }; }
    case 'week':       return { $gte: startOfWeek(now),  $lte: endOfDay(now) };
    case 'month':      return { $gte: startOfMonth(now), $lte: endOfDay(now) };
    case 'lastmonth': {
      const s = new Date(now.getFullYear(), now.getMonth()-1, 1, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(),   0, 23, 59, 59, 999);
      return { $gte: s, $lte: e };
    }
    case 'last3months': {
      const s = new Date(now); s.setMonth(s.getMonth()-3); startOfDay(s);
      return { $gte: s, $lte: endOfDay(now) };
    }
    default:           return { $gte: startOfDay(now),   $lte: endOfDay(now) };
  }
}

// ── GET /api/reports/summary ──────────────────────────────────────────────────
router.get('/summary', protect, async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const [paid, byMethod, activeTables] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: dateRange } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: dateRange } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { revenue: -1 } },
      ]),
      Table.countDocuments({ status: 'occupied' }),
    ]);

    const allStatuses = await Order.aggregate([
      { $match: { createdAt: dateRange } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const totalSales    = paid[0]?.total ?? 0;
    const totalOrders   = paid[0]?.count ?? 0;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    res.json({
      totalSales:    parseFloat(totalSales.toFixed(2)),
      totalOrders,
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      activeTables,
      byMethod,
      byStatus: allStatuses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/by-hour ──────────────────────────────────────────────────
router.get('/by-hour', protect, async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $group: {
          _id:     { $hour: { date: '$createdAt', timezone: TZ } },
          revenue: { $sum: '$total' },
          orders:  { $sum: 1 },
      }},
      { $sort: { '_id': 1 } },
    ]);

    const hours = Array.from({ length: 24 }, (_, h) => {
      const found = raw.find(r => r._id === h);
      const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h-12} PM`;
      return { hour: h, label, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 };
    });

    res.json({ hours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/by-day ───────────────────────────────────────────────────
// Daily revenue trend for weekly/monthly/custom views
router.get('/by-day', protect, async (req, res) => {
  try {
    const { period = 'week', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $group: {
          _id: {
            y: { $year:  { date: '$createdAt', timezone: TZ } },
            m: { $month: { date: '$createdAt', timezone: TZ } },
            d: { $dayOfMonth: { date: '$createdAt', timezone: TZ } },
          },
          revenue: { $sum: '$total' },
          orders:  { $sum: 1 },
      }},
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]);

    // Build continuous date list between range start/end
    const rangeStart = dateRange.$gte;
    const rangeEnd   = dateRange.$lte;
    const days = [];
    const cur  = new Date(rangeStart);
    cur.setHours(0,0,0,0);
    while (cur <= rangeEnd) {
      const y = cur.getFullYear(), m = cur.getMonth()+1, d = cur.getDate();
      const found = raw.find(r => r._id.y === y && r._id.m === m && r._id.d === d);
      const label = cur.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      days.push({ date: cur.toISOString().slice(0,10), label, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 });
      cur.setDate(cur.getDate() + 1);
    }

    res.json({ days });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/by-product ───────────────────────────────────────────────
router.get('/by-product', protect, async (req, res) => {
  try {
    const { period = 'today', from, to, limit = 8 } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $unwind: '$items' },
      { $group: {
          _id:     '$items.product',
          name:    { $first: '$items.name' },
          emoji:   { $first: '$items.emoji' },
          qty:     { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: [
            { $cond: [{ $gt: ['$items.priceOverride', null] }, '$items.priceOverride', '$items.price'] },
            '$items.quantity',
          ]}},
      }},
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({ products: raw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/by-category ──────────────────────────────────────────────
router.get('/by-category', protect, async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'pi' } },
      { $unwind: { path: '$pi', preserveNullAndEmptyArrays: true } },
      { $group: {
          _id:     { $ifNull: ['$pi.category', 'Other'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          qty:     { $sum: '$items.quantity' },
      }},
      { $sort: { revenue: -1 } },
    ]);

    res.json({ categories: raw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/recent-orders ────────────────────────────────────────────
router.get('/recent-orders', protect, async (req, res) => {
  try {
    const { limit = 12, period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const orders = await Order.find({ createdAt: dateRange })
      .populate('cashier', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;