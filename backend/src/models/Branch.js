import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    name:         { type: String, required: true, trim: true },
    address:      { type: String, default: '' },
    phone:        { type: String, default: '' },
    email:        { type: String, default: '' },
    isActive:     { type: Boolean, default: true },
    hasFloorPlan: { type: Boolean, default: true },  // true = has tables, false = register only
  },
  { timestamps: true }
);

export default mongoose.model('Branch', branchSchema);
