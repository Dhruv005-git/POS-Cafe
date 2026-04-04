import express from 'express';
import Order from '../models/Order.js';
import Table from '../models/Table.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET all orders (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.table) filter.table = req.query.table;
    // Customers can only see their own orders
    if (req.user.role === 'customer') {
      filter.customerId = req.user._id;
    }
    const orders = await Order.find(filter)
      .populate('table', 'number floor')
      .populate('items.product', 'name emoji')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET single order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'number floor seats')
      .populate('items.product', 'name emoji category');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new order (or merge into existing open order for the table)
router.post('/', protect, async (req, res) => {
  try {
    const { tableId, tableNumber, items, notes, customerId } = req.body;
    const TAX_RATE = 0.05;

    // If table has an existing unpaid order, merge items into it
    if (tableId) {
      const table = await Table.findById(tableId).populate('currentOrder');
      if (table?.currentOrder && table.currentOrder.paymentStatus === 'unpaid') {
        const existingOrder = table.currentOrder;

        // Merge: for each incoming item, add to existing or increment quantity
        for (const newItem of items) {
          const existing = existingOrder.items.find(
            i => i.product.toString() === newItem.product
          );
          if (existing) {
            existing.quantity += newItem.quantity;
          } else {
            existingOrder.items.push(newItem);
          }
        }

        // Recalculate totals
        const subtotal = existingOrder.items.reduce((s, i) => s + i.price * i.quantity, 0);
        existingOrder.subtotal = parseFloat(subtotal.toFixed(2));
        existingOrder.tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
        existingOrder.total = parseFloat((subtotal + existingOrder.tax).toFixed(2));
        if (notes) existingOrder.notes = notes;

        await existingOrder.save();
        return res.json({ order: existingOrder, merged: true });
      }
    }

    // Create fresh order
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax).toFixed(2));

    const order = await Order.create({
      table: tableId || null,
      tableNumber,
      items,
      subtotal,
      tax,
      total,
      cashier: req.user._id,
      customerId: customerId || null,
      notes: notes || '',
    });

    if (tableId) {
      await Table.findByIdAndUpdate(tableId, {
        status: 'occupied',
        currentOrder: order._id,
      });
    }

    res.status(201).json({ order, merged: false });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update order (generic)
router.put('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT send to kitchen
router.put('/:id/send', protect, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'sent' },
      { new: true }
    ).populate('table', 'number floor');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    io.emit('new_order', order);

    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT pay order
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const { method } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: 'paid',
        paymentStatus: 'paid',
        paymentMethod: method || 'cash',
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Free the table
    if (order.table) {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        currentOrder: null,
      });
    }

    const io = req.app.get('io');
    io.emit('payment_done', { orderId: order._id, tableId: order.table });

    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE remove item from order
router.put('/:id/remove-item', protect, async (req, res) => {
  try {
    const { itemId } = req.body;
    const TAX_RATE = 0.05;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.items = order.items.filter(i => i._id.toString() !== itemId);
    const subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
    order.subtotal = parseFloat(subtotal.toFixed(2));
    order.tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
    order.total = parseFloat((subtotal + order.tax).toFixed(2));
    await order.save();

    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update individual item status (kitchen use)
router.put('/:id/item-status', async (req, res) => {
  try {
    const { itemId, status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.status = status;

    // Auto-advance order status based on items
    const allReady = order.items.every(i => i.status === 'ready');
    const anyPreparing = order.items.some(i => i.status === 'preparing');
    if (allReady) order.status = 'ready';
    else if (anyPreparing) order.status = 'preparing';

    await order.save();

    const io = req.app.get('io');
    io.emit('order_update', order);

    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT advance entire order to next stage (kitchen use)
router.put('/:id/advance', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const next = { sent: 'preparing', preparing: 'ready' };
    if (next[order.status]) {
      order.status = next[order.status];
      // Also update all items to match
      order.items.forEach(i => {
        if (order.status === 'preparing') i.status = 'preparing';
        if (order.status === 'ready') i.status = 'ready';
      });
    }

    await order.save();

    const io = req.app.get('io');
    io.emit('order_update', order);

    res.json({ order });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;