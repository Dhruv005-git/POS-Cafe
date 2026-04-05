import express from 'express';
import Category from '../models/Category.js';
import Product  from '../models/Product.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Default palette used when auto-bootstrapping from existing products
const DEFAULTS = {
  Food:     { emoji: '🍽️', color: 'orange',  sortOrder: 0 },
  Beverage: { emoji: '🥤',  color: 'blue',    sortOrder: 1 },
  Snack:    { emoji: '🍿',  color: 'amber',   sortOrder: 2 },
  Dessert:  { emoji: '🍮',  color: 'pink',    sortOrder: 3 },
  Other:    { emoji: '📦',  color: 'slate',   sortOrder: 4 },
};

// ── GET /categories — list all (public) ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    let categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });

    // Auto-bootstrap: if DB has no categories, discover from products
    if (categories.length === 0) {
      const names = await Product.distinct('category');
      const docs  = names.map((name, i) => ({
        name,
        emoji:     DEFAULTS[name]?.emoji     || '📦',
        color:     DEFAULTS[name]?.color     || 'slate',
        sortOrder: DEFAULTS[name]?.sortOrder ?? i,
      }));
      categories = await Category.insertMany(docs);
    }

    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /categories — create (admin) ────────────────────────────────────────
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, emoji, color, sortOrder } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

    const count = await Category.countDocuments();
    const cat   = await Category.create({
      name: name.trim(),
      emoji: emoji || '📦',
      color: color || 'slate',
      sortOrder: sortOrder ?? count,
    });
    res.status(201).json({ category: cat });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Category already exists' });
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /categories/:id — update (admin) ─────────────────────────────────────
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, emoji, color, sortOrder, isActive } = req.body;
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: { name, emoji, color, sortOrder, isActive } },
      { new: true, runValidators: true }
    );
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json({ category: cat });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Category name already taken' });
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /categories/:id — delete (admin, only if no products use it) ──────
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    const productCount = await Product.countDocuments({ category: cat.name });
    if (productCount > 0) {
      return res.status(409).json({
        message: `Cannot delete — ${productCount} product${productCount > 1 ? 's' : ''} still use this category`,
      });
    }

    await cat.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;
