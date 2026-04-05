/**
 * addProducts.js — Add new products to the existing DB without clearing data.
 * Run: node src/addProducts.js
 */
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Product from './models/Product.js';

dotenv.config();

const NEW_PRODUCTS = [
  // ── Food (Indian + fusion additions)
  { name: 'Dal Makhani',       category: 'Food',     price: 220, emoji: '🍛', description: 'Slow-cooked black lentils in rich butter gravy',  tax: 5 },
  { name: 'Butter Naan',       category: 'Food',     price: 50,  emoji: '🫓', description: 'Soft leavened bread baked in tandoor',             tax: 5 },
  { name: 'Veg Biryani',       category: 'Food',     price: 240, emoji: '🍚', description: 'Fragrant basmati rice with spiced vegetables',     tax: 5 },
  { name: 'Masala Dosa',       category: 'Food',     price: 160, emoji: '🫔', description: 'Crispy rice crepe with spiced potato filling',     tax: 5 },
  { name: 'Shakshuka',         category: 'Food',     price: 200, emoji: '🍳', description: 'Poached eggs in spiced tomato sauce',              tax: 5 },
  { name: 'Pasta Bake',        category: 'Food',     price: 270, emoji: '🍲', description: 'Oven-baked pasta with béchamel & mozzarella',     tax: 5 },

  // ── Snacks (additions)
  { name: 'Spring Rolls',      category: 'Snack',    price: 130, emoji: '🥟', description: 'Crispy pan-fried vegetable spring rolls',         tax: 5 },
  { name: 'Mozzarella Sticks', category: 'Snack',    price: 160, emoji: '🧀', description: 'Golden fried mozzarella with marinara dip',       tax: 5 },
  { name: 'Loaded Fries',      category: 'Snack',    price: 180, emoji: '🍟', description: 'Topped with cheese sauce, jalapeños & sour cream', tax: 5 },
  { name: 'Chicken Wings',     category: 'Snack',    price: 260, emoji: '🍗', description: 'Crispy buffalo wings with blue cheese dip',       tax: 5 },

  // ── Beverages (additions)
  { name: 'Strawberry Smoothie', category: 'Beverage', price: 150, emoji: '🍓', description: 'Fresh strawberry blended smoothie',            tax: 0 },
  { name: 'Mint Mojito',         category: 'Beverage', price: 120, emoji: '🍃', description: 'Classic mocktail with fresh mint & lime',      tax: 0 },
  { name: 'Hot Chocolate',       category: 'Beverage', price: 140, emoji: '🍫', description: 'Rich Belgian hot chocolate',                   tax: 0 },
  { name: 'Masala Chai',         category: 'Beverage', price: 60,  emoji: '🍵', description: 'Spiced Indian tea brewed with whole milk',     tax: 0 },
  { name: 'Blue Lagoon',         category: 'Beverage', price: 130, emoji: '🥤', description: 'Blue curacao mocktail with lemon soda',        tax: 0 },
  { name: 'Watermelon Juice',    category: 'Beverage', price: 100, emoji: '🍉', description: 'Fresh cold-pressed watermelon juice',          tax: 0 },

  // ── Desserts (additions)
  { name: 'Brownie Sundae',    category: 'Dessert',  price: 200, emoji: '🍨', description: 'Warm chocolate brownie with vanilla ice cream',  tax: 5 },
  { name: 'Kheer',             category: 'Dessert',  price: 90,  emoji: '🍮', description: 'Traditional creamy rice pudding',               tax: 5 },
  { name: 'Belgian Waffle',    category: 'Dessert',  price: 160, emoji: '🧇', description: 'Crispy waffle with maple syrup & berries',      tax: 5 },
  { name: 'Panna Cotta',       category: 'Dessert',  price: 150, emoji: '🍮', description: 'Italian vanilla cream dessert with berry coulis', tax: 5 },
];

async function addProducts() {
  await connectDB();

  // Only insert products that don't already exist (by name)
  const existing    = await Product.find({}, 'name');
  const existingSet = new Set(existing.map(p => p.name));

  const toInsert = NEW_PRODUCTS.filter(p => !existingSet.has(p.name));

  if (toInsert.length === 0) {
    console.log('✅ All products already exist — nothing to add.');
    process.exit(0);
  }

  const inserted = await Product.insertMany(toInsert);
  console.log(`\n✅ Added ${inserted.length} new products:\n`);
  inserted.forEach(p => console.log(`   ${p.emoji}  ${p.name.padEnd(22)} ₹${p.price}  [${p.category}]`));
  console.log(`\nSkipped ${NEW_PRODUCTS.length - toInsert.length} already-existing products.`);
  process.exit(0);
}

addProducts().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
