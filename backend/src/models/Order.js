import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:          String,
  price:         Number,                              // original product price
  priceOverride: { type: Number, default: null },     // staff-set price override
  discount:      { type: Number, default: 0 },        // item-level discount %
  emoji:         { type: String, default: '🍽️' },
  quantity:      { type: Number, default: 1 },
  notes:         { type: String, default: '' },
  status:        { type: String, enum: ['pending', 'preparing', 'ready'], default: 'pending' },
  selectedExtras: [{ name: String, price: Number }],
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
  tableNumber: Number,
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['draft', 'sent', 'preparing', 'ready', 'paid', 'cancelled'],
    default: 'draft'
  },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', ''], default: '' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  notes: { type: String, default: '' }
}, { timestamps: true });

orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Order', orderSchema);