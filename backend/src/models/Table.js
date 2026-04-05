import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  floor: { type: String, default: 'Ground Floor' },
  floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', default: null },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  seats: { type: Number, default: 4 },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' },
  isActive: { type: Boolean, default: true },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null }
}, { timestamps: true });

export default mongoose.model('Table', tableSchema);