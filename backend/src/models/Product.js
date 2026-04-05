import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  emoji: { type: String, default: '🍽️' },
  tax: { type: Number, default: 0 },
  unit: { type: String, default: 'plate' },
  isAvailable: { type: Boolean, default: true },
  sendToKitchen: { type: Boolean, default: true },
  extras: [{
    name:  { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  }],
  variants: [{
    attribute: String,
    values: [{ label: String, extraPrice: Number }]
  }]
}, { timestamps: true });

export default mongoose.model('Product', productSchema);