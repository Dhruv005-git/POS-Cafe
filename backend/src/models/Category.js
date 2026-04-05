import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true, unique: true },
    emoji:     { type: String, default: '📦' },
    color:     { type: String, default: 'slate' }, // color keyword: orange, blue, pink, amber, slate, emerald, purple, rose
    sortOrder: { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
