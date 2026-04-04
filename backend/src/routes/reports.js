import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Table from '../models/Table.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────────────
const startOfDay  = (d) => { const x = new Date(d); x.setHours(0,0,0,0);   return x; };
const endOfDay    = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const startOfWeek = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); x.setHours(0,0,0,0); return x; };
const startOfMonth= (d) => { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; };

function buildDateRange(period, from, to) {
  const now = new Date();
  if (from && to)    return { $gte: new Date(from), $lte: new Date(to) };
  if (period === 'today')   return { $gte: startOfDay(now),   $lte: endOfDay(now) };
  if (period === 'week')    return { $gte: startOfWeek(now),  $lte: endOfDay(now) };
  if (period === 'month')   return { $gte: startOfMonth(now), $lte: endOfDay(now) };
  // default: today
  return { $gte: startOfDay(now), $lte: endOfDay(now) };
}

// ── GET /api/reports/summary ─────────────────────────────────────────────────
// Returns KPI cards: totalSales, totalOrders, avgOrderValue, activeTables
router.get('/summary', protect, async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const [paid, allStatuses, activeTables] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: 'paid', createdAt: dateRange } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: dateRange } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Table.countDocuments({ status: 'occupied' }),
    ]);

    const totalSales    = paid[0]?.total  ?? 0;
    const totalOrders   = paid[0]?.count  ?? 0;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // payment method breakdown
    const byMethod = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]);

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

// ── GET /api/reports/by-hour ─────────────────────────────────────────────────
// Returns hourly sales array for line/bar chart
router.get('/by-hour', protect, async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      {
        $group: {
          _id:     { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } },
          revenue: { $sum: '$total' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    // Fill all 24 hours so chart has continuous x-axis
    const hours = Array.from({ length: 24 }, (_, h) => {
      const found = raw.find(r => r._id === h);
      const label = h === 0 ? '12 AM'
        : h < 12 ? `${h} AM`
        : h === 12 ? '12 PM'
        : `${h - 12} PM`;
      return { hour: h, label, revenue: found?.revenue ?? 0, orders: found?.orders ?? 0 };
    });

    res.json({ hours });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/by-product ──────────────────────────────────────────────
// Top products by revenue + quantity sold
router.get('/by-product', protect, async (req, res) => {
  try {
    const { period = 'today', from, to, limit = 8 } = req.query;
    const dateRange = buildDateRange(period, from, to);

    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $unwind: '$items' },
      {
        $group: {
          _id:      '$items.product',
          name:     { $first: '$items.name' },
          emoji:    { $first: '$items.emoji' },
          qty:      { $sum: '$items.quantity' },
          revenue:  { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({ products: raw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/by-category ─────────────────────────────────────────────
// Sales grouped by product category — for pie chart
router.get('/by-category', protect, async (req, res) => {
  try {
    const { period = 'today', from, to } = req.query;
    const dateRange = buildDateRange(period, from, to);

    // Join with products to get category
    const raw = await Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: dateRange } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productInfo',
        },
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:     { $ifNull: ['$productInfo.category', 'Other'] },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          qty:     { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ categories: raw });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/reports/recent-orders ───────────────────────────────────────────
// Last N orders for the table on dashboard
router.get('/recent-orders', protect, async (req, res) => {
  try {
    const { limit = 10, period = 'today', from, to } = req.query;
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