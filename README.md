# ☕ POS Cafe — Restaurant Point-of-Sale System

> A full-featured, real-time Point-of-Sale system for cafés and restaurants.  
> Built with the **MERN stack** + **Socket.io** · Dark-mode UI · Mobile ordering via QR code.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [User Roles & Credentials](#user-roles--credentials)
- [API Reference](#api-reference)
- [Key Workflows](#key-workflows)
- [Screenshots & Pages](#screenshots--pages)
- [Data Models](#data-models)
- [Contributing](#contributing)

---

## Overview

POS Cafe is a production-ready, multi-branch restaurant management system. It handles the complete order lifecycle — from a customer scanning a QR code at their table, through the kitchen display system, all the way to payment collection and session closing.

Everything is real-time via **Socket.io**: new orders beep on the Kitchen Display instantly, the floor plan updates live, and payment events propagate across all connected devices simultaneously.

---

## Features

### 🖥️ POS / Staff Interface
- **Floor Plan View** — drag-to-place tables across multiple named floors; colour-coded by occupancy status
- **Order Screen** — add items by category, set quantity, apply per-item discounts, add notes
- **Product Extras** — single-select add-ons (e.g. *Large +₹50*, *Extra Cheese +₹30*) configurable per product
- **Quick Register Mode** — branches without a floor plan go straight to the register; no table required
- **Payment Modal** — Cash (with change calculator), Card, and UPI QR (generated from the admin-configured UPI ID)
- **Session Management** — opening balance, cash tracking, closing summary per shift

### 👨‍🍳 Kitchen Display System (KDS)
- Real-time order cards: **To Cook → Preparing → Ready**
- Per-item tick-off (strike-through when an individual item is ready)
- **Search** by order number or item name
- **Product & Category filters** (collapsible sidebar)
- **Per-column pagination** (4 cards per page)
- Urgent timer highlight (red pulse after 10 min)
- New-order audio beep

### 📊 Admin Panel
| Section | Capabilities |
|---|---|
| **Dashboard** | Revenue charts, top products, order volume — filterable by day / week / month / custom range |
| **Orders** | Full order list with search, status filter, paginated (15/page), inline payment collection |
| **Products** | Create / edit / delete products; emoji picker, extras manager, availability toggle |
| **Categories** | Create / edit / delete categories with custom emoji & colour; expandable product list per category |
| **Branches** | Multi-branch management with address, phone, floor-plan toggle |
| **Floor Plan** | Visual drag-and-drop table editor per floor |
| **Settings** | Café name, tax rate, currency, UPI ID — all saved to DB |

### 📱 Mobile Customer Ordering
- Accessible at `http://<your-ip>:5173/menu` (or via table-specific QR code)
- 6-step flow: **Branch select → Menu → Cart → Confirm → Success → Track**
- Branch selection auto-skipped if only one branch or `branchId` is in the URL
- Orders appear in the Kitchen Display instantly (created as `sent` status)
- Payment collected at the counter by staff via Admin Orders → Collect Payment

### 🔐 Authentication
- JWT-based auth with role-based access control
- Roles: **Admin**, **Staff**, **Kitchen**
- Protected routes per role; kitchen display is unprotected (kiosk-friendly)

---

## Tech Stack

### Frontend
| Package | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Build tool & dev server |
| React Router v6 | Client-side routing |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion | Page & component animations |
| Socket.io Client | Real-time events |
| Axios | HTTP client |
| Recharts | Dashboard charts |
| qrcode.react | UPI QR code generation |
| react-hot-toast | Toast notifications |
| lucide-react | Icon set |

### Backend
| Package | Purpose |
|---|---|
| Express 4 | HTTP server & routing |
| Mongoose 8 | MongoDB ODM |
| Socket.io 4 | WebSocket server |
| JSON Web Token | Auth tokens |
| bcryptjs | Password hashing |
| dotenv | Environment config |
| nodemon | Dev hot-reload |

### Database
- **MongoDB** (local or Atlas)

---

## Project Structure

```
POS-Cafe/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app + Socket.io + route registration
│   │   ├── seed.js             # Full database seeder (3000+ orders, Jan–Apr 2026)
│   │   ├── addProducts.js      # Additive product seeder (safe — no data wipe)
│   │   ├── config/
│   │   │   └── db.js           # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js         # protect + requireRole middleware
│   │   ├── models/
│   │   │   ├── Branch.js
│   │   │   ├── Category.js
│   │   │   ├── Floor.js
│   │   │   ├── Order.js
│   │   │   ├── Product.js
│   │   │   ├── Session.js
│   │   │   ├── Settings.js
│   │   │   ├── Table.js
│   │   │   └── User.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── branches.js
│   │       ├── categories.js
│   │       ├── customers.js
│   │       ├── floors.js
│   │       ├── menu.js         # Public menu API (no auth) for mobile ordering
│   │       ├── orders.js
│   │       ├── products.js
│   │       ├── reports.js
│   │       ├── sessions.js
│   │       ├── settings.js
│   │       └── tables.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg         # Coffee-cup favicon
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js        # Axios instance with JWT interceptor
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── TopBar.jsx
│   │   │   │   └── POSLayout.jsx
│   │   │   └── POS/
│   │   │       ├── Cart.jsx
│   │   │       ├── CartItem.jsx
│   │   │       ├── FloorView.jsx
│   │   │       ├── PaymentModal.jsx
│   │   │       └── ProductCard.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   ├── useOrder.js     # Cart state, totals, order persistence
│   │   │   └── useSocket.js    # Socket.io event helpers
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx
│   │   │   ├── CustomerDisplay.jsx
│   │   │   ├── CustomerOrderPage.jsx  # Mobile ordering (public)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── KitchenDisplay.jsx
│   │   │   ├── OrderScreen.jsx
│   │   │   ├── POSShell.jsx
│   │   │   └── admin/
│   │   │       ├── AdminCategories.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AdminLayout.jsx
│   │   │       ├── AdminOrders.jsx
│   │   │       ├── AdminProducts.jsx
│   │   │       ├── AdminSettings.jsx
│   │   │       ├── Branches.jsx
│   │   │       └── FloorPlan.jsx
│   │   ├── utils/
│   │   │   └── sound.js        # Web Audio API beep for new orders
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles/
│   │       └── index.css       # Tailwind + custom design tokens
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally on `mongodb://localhost:27017` (or a MongoDB Atlas URI)

### 1. Clone the repository

```bash
git clone https://github.com/Dhruv005-git/pos-cafe.git
cd pos-cafe
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

### 3. Configure environment variables

Create `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/pos-cafe
JWT_SECRET=your_super_secret_key_change_this
PORT=5000
```

> See [Environment Variables](#environment-variables) for full details.

### 4. Seed the database

```bash
cd backend
npm run seed
```

This creates **2 branches, 24+ products, 10 tables, 9 users, and ~3,000 realistic paid orders** spanning January–April 2026.

### 5. Start both servers

```bash
# Backend (port 5000)
cd backend
npm run dev

# Frontend (port 5173) — new terminal
cd frontend
npm run dev
```

### 6. Open the app

| URL | Description |
|---|---|
| `http://localhost:5173/login` | Login page |
| `http://localhost:5173/admin` | Admin panel |
| `http://localhost:5173/pos/floor` | POS floor view |
| `http://localhost:5173/kitchen` | Kitchen Display (no auth needed) |
| `http://localhost:5173/menu` | Mobile customer ordering (public) |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing JWT tokens |
| `PORT` | ❌ | `5000` | Backend server port |

---

## Database Seeding

### Full seed (creates all demo data)
```bash
cd backend
npm run seed
```
⚠️ **This wipes ALL existing data** (orders, sessions, users, products, tables, etc.) before reseeding.

**What it creates:**
- 2 branches: *Main Branch* (with floor plan) and *Odoo Cafe* (register-only)
- 2 floors: Ground Floor + First Floor (linked to Main Branch)
- 10 tables (5 per floor)
- 24 products across Food, Beverage, Snack, Dessert categories
- 9 users (Admin, Staff ×2, Kitchen, Customer ×5)
- ~3,000+ paid orders from Jan 1 → Apr 5 2026
- 2 sessions per day (morning + evening)
- 4 live demo orders in the Kitchen Display

### Add more products (non-destructive)
```bash
cd backend
node src/addProducts.js
```
Adds 20 new products without clearing any existing data. Skips duplicates by name.

---

## User Roles & Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| 👑 Admin | `admin@cafe.com` | `admin123` | Full access — admin panel, POS, settings |
| 🧾 Staff | `staff@cafe.com` | `staff123` | POS, floor plan, payment collection |
| 🧾 Staff 2 | `staff2@cafe.com` | `staff123` | POS, floor plan, payment collection |
| 👨‍🍳 Kitchen | `kitchen@cafe.com` | `kitchen123` | Kitchen Display only |

> ℹ️ Customer accounts exist in the DB but customers order via the public `/menu` mobile page — no login needed.

---

## API Reference

All authenticated routes require the header:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| POST | `/api/auth/signup` | ❌ | Register new user |
| GET | `/api/auth/me` | ✅ | Get current user |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | ✅ | List all products |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Categories
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/categories` | ✅ | List all (auto-bootstraps from products if empty) |
| POST | `/api/categories` | Admin | Create category |
| PUT | `/api/categories/:id` | Admin | Update name/emoji/color |
| DELETE | `/api/categories/:id` | Admin | Delete (blocked if products use it) |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/orders` | ✅ | List orders (filter: `?status=sent`) |
| POST | `/api/orders` | ✅ | Create order |
| PUT | `/api/orders/:id/advance` | ✅ | Advance status (sent→preparing→ready) |
| PUT | `/api/orders/:id/pay` | ✅ | Collect payment (cash/card/upi) |
| PUT | `/api/orders/:id/item-status` | ✅ | Toggle individual item ready state |

### Menu (Public — no auth)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/menu` | ❌ | Get available products + branches |
| POST | `/api/menu/order` | ❌ | Place mobile order |
| GET | `/api/menu/order/:id` | ❌ | Track order status |

### Settings
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/settings` | ❌ | Get global settings (UPI ID, tax rate, etc.) |
| PUT | `/api/settings` | Admin | Update global settings |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/reports/dashboard` | Admin | Revenue, top products, order volume |
| GET | `/api/reports/categories` | Admin | Sales breakdown by category |

---

## Key Workflows

### POS Order Flow
```
Staff logs in
  └─► Floor plan → select table (or Register for no-table branch)
        └─► Open session (with opening cash balance)
              └─► Order screen → add products → set extras/notes/discount
                    └─► Send to kitchen (socket: new_order)
                          └─► Kitchen stamps items ready
                                └─► Staff opens payment modal
                                      └─► Choose Cash / Card / UPI
                                            └─► Payment confirmed → order marked paid
                                                  └─► Table freed, session updated
```

### Mobile Customer Order Flow
```
Customer scans QR at table
  └─► /menu page loads (no login)
        └─► Select branch (auto-skipped if only 1)
              └─► Browse menu → add to cart
                    └─► Confirm order
                          └─► Order sent to kitchen (status: sent)
                                └─► Track page shows live status
                                      └─► Pay at counter (staff collects via Admin Orders)
```

### Kitchen Display States
```
sent → preparing → ready → (paid — removed from KDS)
```

---

## Screenshots & Pages

| Page | Route | Role |
|---|---|---|
| Login | `/login` | Public |
| Admin Dashboard | `/admin/dashboard` | Admin |
| Admin Orders | `/admin/orders` | Admin |
| Admin Products | `/admin/products` | Admin |
| Admin Categories | `/admin/categories` | Admin |
| Admin Settings | `/admin/settings` | Admin |
| Branches | `/admin/branches` | Admin |
| Floor Plan Editor | `/admin/floor-plan` | Admin |
| POS Floor View | `/pos/floor` | Staff / Admin |
| POS Order Screen | `/pos/order/:tableId` | Staff / Admin |
| POS Register | `/pos/register` | Staff / Admin |
| Kitchen Display | `/kitchen` | Kitchen (no auth) |
| Customer Display | `/customer` | Public kiosk |
| Mobile Ordering | `/menu` | Public |

---

## Data Models

### Order
```js
{
  orderNumber: String,        // "ORD-0001"
  table: ObjectId,            // ref Table (nullable for walk-in)
  tableNumber: Number,
  items: [{
    product: ObjectId,        // ref Product
    name: String,
    price: Number,
    quantity: Number,
    emoji: String,
    discount: Number,         // percentage
    notes: String,
    selectedExtras: [{ name, price }],
    status: 'pending' | 'ready',
  }],
  status: 'draft' | 'sent' | 'preparing' | 'ready' | 'paid' | 'cancelled',
  subtotal: Number,
  tax: Number,
  total: Number,
  paymentMethod: 'cash' | 'card' | 'upi',
  paymentStatus: 'unpaid' | 'paid',
  cashier: ObjectId,          // ref User
}
```

### Product
```js
{
  name: String,
  category: String,           // dynamic — managed via Categories API
  price: Number,
  emoji: String,
  description: String,
  tax: Number,                // percentage (e.g. 5 = 5%)
  isAvailable: Boolean,
  sendToKitchen: Boolean,
  extras: [{ name: String, price: Number }],
}
```

### Session
```js
{
  branchId: ObjectId,
  openedBy: ObjectId,         // ref User
  openedAt: Date,
  closedAt: Date,
  status: 'open' | 'closed',
  openingCash: Number,
  closingCash: Number,
  cashSales: Number,
  totalSales: Number,
  totalOrders: Number,
}
```

### Settings (singleton)
```js
{
  key: 'global',              // always 'global'
  upiId: String,              // e.g. "mycafe@upi"
  cafeName: String,
  taxRate: Number,            // percentage (e.g. 5)
  currency: String,           // e.g. "INR"
}
```

---

## Socket Events

| Event | Direction | Payload | Description |
|---|---|---|---|
| `new_order` | Server → Client | `Order` | New order placed (POS or mobile) |
| `order_update` | Server → Client | `Order` | Order status changed |
| `payment_done` | Server → Client | `{ orderId }` | Order paid, remove from KDS |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © 2026 POS Cafe
