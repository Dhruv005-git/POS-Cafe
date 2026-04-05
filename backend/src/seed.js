/**
 * Comprehensive seed — POS Cafe
 * Date range: 1 Jan 2026 → 5 Apr 2026 (today)
 * Covers: 2 branches, 2 floors, 24 products, 10 tables, 9 users,
 *         ~3000+ paid orders, 2 sessions/day, realistic INR amounts
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Product from './models/Product.js';
import Table from './models/Table.js';
import User from './models/User.js';
import Branch from './models/Branch.js';
import Floor from './models/Floor.js';
import Order from './models/Order.js';
import Session from './models/Session.js';

dotenv.config();

// ── Tiny helpers ──────────────────────────────────────────────────────────────
const rand   = (min, max)  => Math.floor(Math.random() * (max - min + 1)) + min;
const pick   = (arr)       => arr[Math.floor(Math.random() * arr.length)];
const pickN  = (arr, n)    => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const r2     = (n)         => Math.round(n * 100) / 100;
const clamp  = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function dateRange(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function shiftTime(base, hour, jitterMin = 40) {
  const d = new Date(base);
  d.setHours(hour, rand(0,59), rand(0,59), 0);
  d.setMinutes(d.getMinutes() + rand(-jitterMin, jitterMin));
  return d;
}

// ── Static master data ────────────────────────────────────────────────────────
const BRANCHES = [
  { name:'Main Branch', address:'123 Cafe Street, Food District, Vadodara', phone:'+91 98765 43210', email:'main@poscafe.com',   hasFloorPlan:true,  isActive:true },
  { name:'Odoo Cafe',   address:'Makarpura, Vadodara',                       phone:'9998887772',     email:'branch@odoo.com',    hasFloorPlan:false, isActive:true },
];

const PRODUCTS = [
  // ── Food
  { name:'Margherita Pizza',    category:'Food',     price:350,  emoji:'🍕', description:'Classic tomato & mozzarella',          tax:5 },
  { name:'Pasta Carbonara',     category:'Food',     price:280,  emoji:'🍝', description:'Creamy egg & pancetta pasta',           tax:5 },
  { name:'Chicken Burger',      category:'Food',     price:220,  emoji:'🍔', description:'Grilled chicken with lettuce',          tax:5 },
  { name:'Caesar Salad',        category:'Food',     price:190,  emoji:'🥗', description:'Romaine, croutons, parmesan',           tax:5 },
  { name:'Paneer Tikka',        category:'Food',     price:260,  emoji:'🧀', description:'Tandoor-grilled cottage cheese',        tax:5 },
  { name:'Club Sandwich',       category:'Food',     price:180,  emoji:'🥪', description:'Triple-decker with veggies & chicken',  tax:5 },
  { name:'Penne Arrabbiata',    category:'Food',     price:250,  emoji:'🍝', description:'Spicy tomato penne',                   tax:5 },
  { name:'Veg Wrap',            category:'Food',     price:160,  emoji:'🌯', description:'Grilled veggies in tortilla',           tax:5 },
  // ── Snacks
  { name:'French Fries',        category:'Snack',    price:120,  emoji:'🍟', description:'Crispy golden fries',                  tax:5 },
  { name:'Garlic Bread',        category:'Snack',    price:90,   emoji:'🥖', description:'Toasted with herb butter',              tax:5 },
  { name:'Onion Rings',         category:'Snack',    price:110,  emoji:'🧅', description:'Crispy battered onion rings',           tax:5 },
  { name:'Nachos & Salsa',      category:'Snack',    price:140,  emoji:'🌮', description:'Tortilla chips with dips',              tax:5 },
  // ── Beverages
  { name:'Espresso',            category:'Beverage', price:80,   emoji:'☕', description:'Double shot espresso',                 tax:0 },
  { name:'Cappuccino',          category:'Beverage', price:120,  emoji:'☕', description:'Espresso with steamed milk foam',      tax:0 },
  { name:'Latte',               category:'Beverage', price:130,  emoji:'🥛', description:'Smooth espresso & steamed milk',       tax:0 },
  { name:'Fresh Lemonade',      category:'Beverage', price:90,   emoji:'🍋', description:'Freshly squeezed lemonade',            tax:0 },
  { name:'Mango Lassi',         category:'Beverage', price:100,  emoji:'🥭', description:'Chilled yogurt mango drink',           tax:0 },
  { name:'Cold Coffee',         category:'Beverage', price:140,  emoji:'🧋', description:'Iced coffee with cream',               tax:0 },
  { name:'Green Tea',           category:'Beverage', price:70,   emoji:'🍵', description:'Japanese matcha green tea',            tax:0 },
  { name:'Fresh Orange Juice',  category:'Beverage', price:110,  emoji:'🍊', description:'Cold pressed orange juice',            tax:0 },
  // ── Desserts
  { name:'Chocolate Lava Cake', category:'Dessert',  price:180,  emoji:'🍫', description:'Warm choco cake, molten center',       tax:5 },
  { name:'Tiramisu',            category:'Dessert',  price:160,  emoji:'🍰', description:'Classic Italian coffee dessert',       tax:5 },
  { name:'Cheesecake',          category:'Dessert',  price:170,  emoji:'🎂', description:'New York style baked cheesecake',      tax:5 },
  { name:'Gulab Jamun',         category:'Dessert',  price:80,   emoji:'🍮', description:'Soft milk-solid dumplings in syrup',   tax:5 },
];

const USERS = [
  { name:'Admin User',   email:'admin@cafe.com',    password:'admin123',    role:'admin'    },
  { name:'Riya Sharma',  email:'staff@cafe.com',    password:'staff123',    role:'staff'    },
  { name:'Arjun Singh',  email:'staff2@cafe.com',   password:'staff123',    role:'staff'    },
  { name:'Chef Kumar',   email:'kitchen@cafe.com',  password:'kitchen123',  role:'kitchen'  },
  { name:'Priya Patel',  email:'customer@cafe.com', password:'customer123', role:'customer' },
  { name:'Rohan Mehta',  email:'rohan@email.com',   password:'customer123', role:'customer' },
  { name:'Sneha Gupta',  email:'sneha@email.com',   password:'customer123', role:'customer' },
  { name:'Amit Verma',   email:'amit@email.com',    password:'customer123', role:'customer' },
  { name:'Neha Joshi',   email:'neha@email.com',    password:'customer123', role:'customer' },
];

// Payment weights: cash 50%, upi 30%, card 20%
const PAY_WEIGHTED = ['cash','cash','cash','cash','cash','upi','upi','upi','card','card'];
const NOTES_POOL   = ['Less spicy','Extra spicy','No onion','No garlic','Less sugar','Extra cheese','No ice','Well done','','','','',''];

// ── computeTotals ─────────────────────────────────────────────────────────────
function computeTotals(items, prodMap) {
  let subtotal = 0, tax = 0;
  for (const item of items) {
    const p       = prodMap[item.product.toString()];
    const effP    = item.price * (1 - (item.discount||0)/100);
    const lineT   = effP * item.quantity;
    const taxRate = (p?.tax || 0) / 100;
    subtotal += lineT;
    tax      += lineT * taxRate;
  }
  return { subtotal:r2(subtotal), tax:r2(tax), total:r2(subtotal+tax) };
}

// ── SEED ─────────────────────────────────────────────────────────────────────
async function seed() {
  await connectDB();

  // Clear all
  await Promise.all([
    Product.deleteMany({}), Table.deleteMany({}),
    User.deleteMany({}),    Branch.deleteMany({}),
    Floor.deleteMany({}),   Order.deleteMany({}),
    Session.deleteMany({}),
  ]);
  console.log('🧹 Cleared all collections');

  // ── Branches
  const branches   = await Branch.insertMany(BRANCHES);
  const mainBranch = branches[0];
  const odooBranch = branches[1];
  console.log(`✅ ${branches.length} branches`);

  // ── Floors (linked to main branch)
  const floors = await Floor.insertMany([
    { name:'Ground Floor', branchId:mainBranch._id, isActive:true },
    { name:'First Floor',  branchId:mainBranch._id, isActive:true },
  ]);
  const gFloor = floors[0];
  const fFloor = floors[1];
  console.log(`✅ ${floors.length} floors (linked to ${mainBranch.name})`);

  // ── Products
  const products = await Product.insertMany(PRODUCTS);
  const prodMap  = {};
  products.forEach(p => { prodMap[p._id.toString()] = p; });
  console.log(`✅ ${products.length} products`);

  // ── Tables (linked to branch + floor by name)
  const tableConfig = [
    { number:1,  floor:'Ground Floor', floorId:gFloor._id, seats:4 },
    { number:2,  floor:'Ground Floor', floorId:gFloor._id, seats:4 },
    { number:3,  floor:'Ground Floor', floorId:gFloor._id, seats:2 },
    { number:4,  floor:'Ground Floor', floorId:gFloor._id, seats:6 },
    { number:5,  floor:'Ground Floor', floorId:gFloor._id, seats:2 },
    { number:6,  floor:'First Floor',  floorId:fFloor._id, seats:4 },
    { number:7,  floor:'First Floor',  floorId:fFloor._id, seats:4 },
    { number:8,  floor:'First Floor',  floorId:fFloor._id, seats:6 },
    { number:9,  floor:'First Floor',  floorId:fFloor._id, seats:2 },
    { number:10, floor:'First Floor',  floorId:fFloor._id, seats:8 },
  ];
  const tables = await Table.insertMany(
    tableConfig.map(t => ({ ...t, branchId:mainBranch._id, status:'available' }))
  );
  console.log(`✅ ${tables.length} tables (5 per floor)`);

  // ── Users
  const createdUsers = [];
  for (const u of USERS) { createdUsers.push(await User.create(u)); }
  const adminUser  = createdUsers[0];
  const staffUsers = createdUsers.filter(u => u.role === 'staff');
  const customers  = createdUsers.filter(u => u.role === 'customer');
  console.log(`✅ ${createdUsers.length} users`);

  // ── Generate orders: 1 Jan → 5 Apr 2026 ─────────────────────────────────
  const START = new Date('2026-01-01T00:00:00+05:30');
  const END   = new Date('2026-04-05T23:59:59+05:30');

  const allOrders  = [];
  const allSessions= [];
  let orderCounter = 0;

  // Build day list
  const days = [];
  const cur  = new Date(START);
  while (cur <= END) { days.push(new Date(cur)); cur.setDate(cur.getDate()+1); }

  for (const day of days) {
    const dow       = day.getDay(); // 0=Sun 6=Sat
    const isWeekend = dow === 0 || dow === 6;
    const month     = day.getMonth(); // 0=Jan … 3=Apr
    const isToday   = day.toDateString() === new Date('2026-04-05').toDateString();

    // Ramp up orders over months — realistic growth
    // Jan: base, Feb: +10%, Mar: +20%, Apr: +25%
    const growthFactor = [1, 1.1, 1.2, 1.25][month] ?? 1;
    const baseOrders   = isWeekend ? rand(35, 55) : rand(18, 30);
    const ordersForDay = isToday ? rand(28, 40)  // today has good data
      : Math.round(baseOrders * growthFactor);

    // Shift windows
    const mStart = shiftTime(day, 8);
    const mEnd   = shiftTime(day, 16);
    const eStart = shiftTime(day, 15);
    const eEnd   = isToday ? new Date() : shiftTime(day, 23); // today ends now

    const mStaff = pick(staffUsers);
    const eStaff = pick(staffUsers);

    let mOrders=0, mCash=0, mTotal=0;
    let eOrders=0, eCash=0, eTotal=0;

    for (let i = 0; i < ordersForDay; i++) {
      orderCounter++;
      const isMorning  = i < Math.floor(ordersForDay * 0.54);
      const fromTime   = isMorning ? mStart : eStart;
      const toLimit    = isMorning
        ? new Date(mStart.getTime() + 7*3600000)
        : new Date(eStart.getTime() + 7*3600000);
      const orderTime  = dateRange(fromTime, toLimit < eEnd ? toLimit : eEnd);

      // Items (1–4 items, weighted 2–3)
      const itemCount = pick([1,2,2,3,3,3,4]);
      const chosen    = pickN(products, itemCount);

      const tableForOrder    = Math.random() > 0.28 ? pick(tables)   : null;
      const customerForOrder = Math.random() > 0.60 ? pick(customers) : null;

      // Recent months: more discounts, more notes
      const isRecent = month >= 2;
      const items = chosen.map(p => {
        const qty        = pick([1,1,1,2,2,3]);
        const hasDiscount= isRecent && Math.random() < 0.15;
        const discount   = hasDiscount ? pick([5,10,15,20]) : 0;
        return {
          product: p._id,
          name:    p.name,
          price:   p.price,
          emoji:   p.emoji,
          quantity: qty,
          discount,
          notes:   isRecent && Math.random() < 0.2 ? pick(NOTES_POOL.filter(Boolean)) : '',
          status:  'ready',
          priceOverride: null,
        };
      });

      const { subtotal, tax, total } = computeTotals(items, prodMap);
      const method = pick(PAY_WEIGHTED);
      const cashier= isMorning ? mStaff : eStaff;

      allOrders.push({
        orderNumber:   `ORD-${String(orderCounter).padStart(4,'0')}`,
        table:         tableForOrder?._id || null,
        tableNumber:   tableForOrder?.number || null,
        items,
        status:        'paid',
        subtotal, tax, total,
        paymentMethod: method,
        paymentStatus: 'paid',
        cashier:       cashier._id,
        customerId:    customerForOrder?._id || null,
        notes:         '',
        createdAt:     orderTime,
        updatedAt:     orderTime,
      });

      if (isMorning) { mOrders++; mTotal+=total; if(method==='cash') mCash+=total; }
      else           { eOrders++; eTotal+=total; if(method==='cash') eCash+=total; }
    }

    // Sessions
    const mOpen  = r2(rand(800, 2500));
    const eOpen  = r2(rand(500, 1500));
    allSessions.push(
      {
        branchId: mainBranch._id, openedBy: mStaff._id,
        openedAt: mStart, closedAt: mEnd, status: 'closed',
        openingCash: mOpen,
        closingCash: r2(mOpen + mCash + rand(-120, 80)),
        cashSales: r2(mCash), totalSales: r2(mTotal), totalOrders: mOrders,
        createdAt: mStart, updatedAt: mEnd,
      },
      {
        branchId: mainBranch._id, openedBy: eStaff._id,
        openedAt: eStart, closedAt: isToday ? undefined : eEnd,
        status: isToday ? 'open' : 'closed',
        openingCash: eOpen,
        closingCash: isToday ? 0 : r2(eOpen + eCash + rand(-80, 50)),
        cashSales: r2(eCash), totalSales: r2(eTotal), totalOrders: eOrders,
        createdAt: eStart, updatedAt: isToday ? eStart : eEnd,
      },
    );
  }

  // Bulk insert
  console.log(`⏳ Inserting ${allOrders.length} orders…`);
  await Order.insertMany(allOrders, { ordered:false });

  console.log(`⏳ Inserting ${allSessions.length} sessions…`);
  await Session.insertMany(allSessions, { ordered:false });

  // ── Live orders for today's demo (April 5) ───────────────────────────────
  const now   = new Date();
  const demoSlots = [
    { t:[products[12],products[0]], tableIdx:0, status:'sent',      time: new Date(now.getTime()-25*60000) },
    { t:[products[13],products[15]], tableIdx:1, status:'preparing', time: new Date(now.getTime()-15*60000) },
    { t:[products[4],products[16],products[8]], tableIdx:2, status:'ready',    time: new Date(now.getTime()-8*60000)  },
    { t:[products[1],products[14]], tableIdx:3, status:'sent',      time: new Date(now.getTime()-35*60000) },
  ];

  for (const slot of demoSlots) {
    orderCounter++;
    const items = slot.t.filter(Boolean).map(p => ({
      product:p._id, name:p.name, price:p.price, emoji:p.emoji,
      quantity:rand(1,2), discount:0, notes:'', status:'pending', priceOverride:null,
    }));
    const { subtotal, tax, total } = computeTotals(items, prodMap);
    await Order.create({
      orderNumber:  `ORD-${String(orderCounter).padStart(4,'0')}`,
      table:        tables[slot.tableIdx]._id,
      tableNumber:  tables[slot.tableIdx].number,
      items, status:slot.status, subtotal, tax, total,
      paymentMethod:'', paymentStatus:'unpaid',
      cashier: adminUser._id, createdAt:slot.time, updatedAt:slot.time,
    });
    // Mark the table as occupied
    await Table.findByIdAndUpdate(tables[slot.tableIdx]._id, { status:'occupied' });
  }

  const finalOrders   = await Order.countDocuments();
  const finalSessions = await Session.countDocuments();

  console.log('\n══════════════════════════════════════════════════');
  console.log('  ✅  SEED COMPLETE — POS Cafe');
  console.log('══════════════════════════════════════════════════');
  console.log(`  📦  Products  : ${products.length}`);
  console.log(`  🏢  Branches  : ${branches.length}  (Main Branch + Odoo Cafe)`);
  console.log(`  🗺️   Floors    : ${floors.length}  (Ground Floor + First Floor → Main Branch)`);
  console.log(`  🪑  Tables    : ${tables.length}  (5 per floor, linked to floors)`);
  console.log(`  👤  Users     : ${createdUsers.length}`);
  console.log(`  📋  Orders    : ${finalOrders}  (Jan 1 → Apr 5 2026)`);
  console.log(`  🔐  Sessions  : ${finalSessions}  (2/day + open evening session today)`);
  console.log(`  🟢  Live KDS  : 4 active orders on T1–T4`);
  console.log('──────────────────────────────────────────────────');
  console.log('  DASHBOARD FILTERS AVAILABLE:');
  console.log('  Today / Yesterday / This Week / This Month');
  console.log('  Last Month / Last 3 Months');
  console.log('  Jan 2026 / Feb 2026 / Mar 2026 / Apr 2026');
  console.log('  Custom Date Range (from → to)');
  console.log('──────────────────────────────────────────────────');
  console.log('  LOGIN CREDENTIALS');
  console.log('  admin@cafe.com    / admin123    👑 Admin');
  console.log('  staff@cafe.com    / staff123    🧾 Staff (Riya)');
  console.log('  staff2@cafe.com   / staff123    🧾 Staff (Arjun)');
  console.log('  kitchen@cafe.com  / kitchen123  👨‍🍳 Kitchen');
  console.log('  customer@cafe.com / customer123 🙋 Customer');
  console.log('══════════════════════════════════════════════════\n');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });