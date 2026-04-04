import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  openedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openedAt: { type: Date, default: Date.now },
  closedAt: { type: Date },
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  openingCash: { type: Number, default: 0 },
  closingCash: { type: Number, default: 0 },
  totalSales: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);