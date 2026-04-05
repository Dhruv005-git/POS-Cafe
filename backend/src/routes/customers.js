import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/customers — admin or staff, list all customers
router.get('/', protect, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('name email createdAt')
      .sort({ createdAt: -1 });
    res.json({ customers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customers/me/orders — customer's own orders
router.get('/me/orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate('table', 'number floor')
      .populate('items.product', 'name emoji')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/customers/:id/orders — admin: get orders for a specific customer
router.get('/:id/orders', protect, requireRole('admin'), async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.id })
      .populate('table', 'number floor')
      .populate('items.product', 'name emoji')
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
