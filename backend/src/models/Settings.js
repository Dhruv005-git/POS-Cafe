import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key:      { type: String, default: 'global', unique: true },
    upiId:    { type: String, default: 'cafe@upi' },
    cafeName: { type: String, default: 'POS Cafe' },
    taxRate:  { type: Number, default: 5 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
