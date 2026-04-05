// backend/src/routes/menu.js  — Public customer-facing ordering API (no auth required)
import express from 'express';
import Product from '../models/Product.js';
import Order   from '../models/Order.js';
import Branch  from '../models/Branch.js';

const router = express.Router();
const TAX_RATE = 0.05;

// ── GET available products ────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isAvailable: true }).sort({ category: 1, name: 1 });
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET all active branches (for branch selection screen) ─────────────────────
router.get('/branches', async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ createdAt: 1 });
    res.json({ branches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET store info (splash — returns first branch name as fallback) ────────────
router.get('/info', async (req, res) => {
  try {
    const branch = await Branch.findOne({ isActive: true }).sort({ createdAt: 1 });
    res.json({
      storeName: branch?.name || 'POS Cafe',
      address:   branch?.address || '',
    });
  } catch {
    res.json({ storeName: 'POS Cafe', address: '' });
  }
});

// ── POST create customer order (no auth) ─────────────────────────────────────
router.post('/orders', async (req, res) => {
  try {
    const { tableId, tableNumber, branchId, items, customerName } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    // Verify products exist and compute totals server-side (don't trust client prices)
    const productIds = items.map(i => i.productId);
    const products   = await Product.find({ _id: { $in: productIds } });
    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    let subtotal = 0;
    const orderItems = [];

    for (const i of items) {
      const product = productMap[i.productId];
      if (!product) continue;

      // Validate extras exist on the product
      const validExtras = (i.selectedExtras || []).filter(se =>
        product.extras?.some(pe => pe.name === se.name && pe.price === se.price)
      );
      const extrasTotal = validExtras.reduce((s, e) => s + e.price, 0);
      const lineUnit    = product.price + extrasTotal;
      subtotal += lineUnit * i.quantity;

      orderItems.push({
        product:        product._id,
        name:           product.name,
        price:          product.price,
        quantity:       i.quantity,
        emoji:          product.emoji || '🍽️',
        notes:          i.notes || '',
        selectedExtras: validExtras,
        status:         'pending',
      });
    }

    const tax   = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    // Build notes: include customer name and/or branch info
    const noteParts = [];
    if (customerName) noteParts.push(`Customer: ${customerName}`);
    if (branchId) {
      const branch = await Branch.findById(branchId);
      if (branch) noteParts.push(`Branch: ${branch.name}`);
    }

    // ⚡ Create order as 'sent' so kitchen sees it immediately
    const order = await Order.create({
      table:       tableId  || null,
      tableNumber: tableNumber || null,
      items:       orderItems,
      subtotal,
      tax,
      total,
      status:        'sent',   // <-- kitchen sees this right away
      paymentStatus: 'unpaid',
      notes:         noteParts.join(' | '),
    });

    // ⚡ Emit socket event so kitchen display gets real-time alert
    const io = req.app.get('io');
    if (io) {
      // Re-fetch with product populated so kitchen card renders correctly
      const populated = await Order.findById(order._id)
        .populate('items.product', 'name emoji')
        .populate('table', 'number floor');
      io.emit('new_order', populated);
    }

    res.status(201).json({
      order: {
        _id:         order._id,
        orderNumber: order.orderNumber,
        total:       order.total,
        status:      order.status,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── GET order tracking status (no auth) ──────────────────────────────────────
router.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('orderNumber status paymentStatus total items createdAt notes')
      .populate('items.product', 'name emoji');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
