import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  branchId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  openedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  openedAt:      { type: Date, default: Date.now },
  closedAt:      { type: Date },
  status:        { type: String, enum: ['open', 'closed'], default: 'open' },
  openingCash:   { type: Number, default: 0 },
  closingCash:   { type: Number, default: 0 },   // actual cash staff counts at end
  cashSales:     { type: Number, default: 0 },   // sum of all cash payments this session
  totalSales:    { type: Number, default: 0 },   // all payment methods
  totalOrders:   { type: Number, default: 0 },
  // expectedCash = openingCash + cashSales (computed on-the-fly)
}, { timestamps: true });

// Virtual: expected cash at close
sessionSchema.virtual('expectedCash').get(function () {
  return this.openingCash + this.cashSales;
});

// Virtual: difference between actual and expected
sessionSchema.virtual('cashDifference').get(function () {
  return this.closingCash - (this.openingCash + this.cashSales);
});

sessionSchema.set('toJSON', { virtuals: true });
sessionSchema.set('toObject', { virtuals: true });

export default mongoose.model('Session', sessionSchema);