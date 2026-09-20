import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String },
    totalCommissionEarned: { type: Number, default: 0 },
    totalCommissionPaid: { type: Number, default: 0 },
    pendingCommission: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Agent', agentSchema);
