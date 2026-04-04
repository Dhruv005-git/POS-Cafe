import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Product from './models/Product.js';
import Table from './models/Table.js';
import User from './models/User.js';
import Branch from './models/Branch.js';

dotenv.config();

const products = [
  { name: 'Margherita Pizza', category: 'Food', price: 12, emoji: '🍕', description: 'Classic tomato & mozzarella', tax: 5 },
  { name: 'Pasta Carbonara', category: 'Food', price: 10, emoji: '🍝', description: 'Creamy egg & pancetta pasta', tax: 5 },
  { name: 'Chicken Burger', category: 'Food', price: 9, emoji: '🍔', description: 'Grilled chicken with lettuce', tax: 5 },
  { name: 'Caesar Salad', category: 'Food', price: 8, emoji: '🥗', description: 'Romaine, croutons, parmesan', tax: 5 },
  { name: 'French Fries', category: 'Snack', price: 4, emoji: '🍟', description: 'Crispy golden fries', tax: 5 },
  { name: 'Garlic Bread', category: 'Snack', price: 3, emoji: '🥖', description: 'Toasted with herb butter', tax: 5 },
  { name: 'Espresso', category: 'Beverage', price: 3, emoji: '☕', description: 'Double shot espresso', tax: 0 },
  { name: 'Cappuccino', category: 'Beverage', price: 4, emoji: '☕', description: 'Espresso with steamed milk foam', tax: 0 },
  { name: 'Fresh Lemonade', category: 'Beverage', price: 3.5, emoji: '🍋', description: 'Freshly squeezed lemonade', tax: 0 },
  { name: 'Chocolate Lava Cake', category: 'Dessert', price: 6, emoji: '🍫', description: 'Warm chocolate cake, molten center', tax: 5 },
  { name: 'Tiramisu', category: 'Dessert', price: 5.5, emoji: '🍰', description: 'Classic Italian coffee dessert', tax: 5 },
  { name: 'Mango Lassi', category: 'Beverage', price: 3.5, emoji: '🥭', description: 'Chilled yogurt mango drink', tax: 0 },
];

const tables = Array.from({ length: 8 }, (_, i) => ({
  number: i + 1,
  floor: 'Ground Floor',
  seats: i < 4 ? 4 : 2,
  status: 'available',
}));

// Demo users for all 4 roles
const users = [
  { name: 'Admin User',    email: 'admin@cafe.com',    password: 'admin123',    role: 'admin'    },
  { name: 'Staff User',    email: 'staff@cafe.com',    password: 'staff123',    role: 'staff'    },
  { name: 'Kitchen Chef',  email: 'kitchen@cafe.com',  password: 'kitchen123',  role: 'kitchen'  },
  { name: 'Customer One',  email: 'customer@cafe.com', password: 'customer123', role: 'customer' },
];

// Demo branch
const branch = {
  name: 'Main Branch',
  address: '123 Cafe Street, Food District',
  phone: '+1 234 567 8900',
  email: 'main@cafe.com',
};

async function seed() {
  await connectDB();

  // Clear existing data
  await Product.deleteMany({});
  await Table.deleteMany({});
  await User.deleteMany({});
  await Branch.deleteMany({});

  // Seed data
  await Product.insertMany(products);
  await Table.insertMany(tables);
  await Branch.insertMany([branch]);

  // Create users one-by-one so the pre-save hash hook runs
  for (const u of users) {
    await User.create(u);
  }

  console.log('✅ Seeded:');
  console.log('   · 12 products');
  console.log('   · 8 tables (Ground Floor)');
  console.log('   · 1 branch (Main Branch)');
  console.log('   · 4 users:');
  console.log('       admin@cafe.com    / admin123    (Admin)');
  console.log('       staff@cafe.com    / staff123    (Staff)');
  console.log('       kitchen@cafe.com  / kitchen123  (Kitchen)');
  console.log('       customer@cafe.com / customer123 (Customer)');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });