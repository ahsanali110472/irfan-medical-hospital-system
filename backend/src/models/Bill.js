import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    category: { type: String, enum: ['room', 'doctor', 'otTechnician', 'anesthesia', 'xray', 'ultrasound', 'other', 'test'], required: true }
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNumber: { type: String, unique: true, index: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    visitInfo: {
      roomName: String,
      roomFeatures: [String],
      otTechnicianName: String,
      otTechnicianFee: Number,
      anesthesiaDoctorName: String,
      anesthesiaDoctorFee: Number,
      doctorName: String,
      doctorFee: Number
    },
    items: [billItemSchema],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
    paidAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Bill', billSchema);


