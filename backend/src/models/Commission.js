import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: 'Bill' }, // Link to specific bill
    commissionAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true }, // Rate at time of calculation
    patientTotalAmount: { type: Number, required: true }, // Patient's total amount at time of commission
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidAt: { type: Date },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model('Commission', commissionSchema);
