import mongoose from 'mongoose';

const assignedProviderSchema = new mongoose.Schema(
  {
    doctorName: { type: String },
    doctorFee: { type: Number },
    otTechnicianName: { type: String },
    otTechnicianFee: { type: Number },
    anesthesiaDoctorName: { type: String },
    anesthesiaDoctorFee: { type: Number }
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    roomName: { type: String },
    roomFeatures: [{ type: String }],
    roomFee: { type: Number },
    otTechnicianName: { type: String },
    otTechnicianFee: { type: Number },
    anesthesiaDoctorName: { type: String },
    anesthesiaDoctorFee: { type: Number },
    doctorName: { type: String },
    doctorFee: { type: Number },
    testIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }]
  },
  { _id: false }
);

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    contact: { type: String },
    cnic: { type: String },
    address: { type: String },
    agentName: { type: String },
    totalAmountReceived: { type: Number, default: 0 },
    agentCommission: { type: Number, default: 0 },
    netAmountAfterCommission: { type: Number, default: 0 }, // Amount after agent commission
    currentBalance: { type: Number, default: 0 }, // Remaining balance after payments
    dues: { type: Number, default: 0 }, // Outstanding amount to be paid
    assignedProviders: assignedProviderSchema,
    visit: visitSchema
  },
  { timestamps: true }
);

export default mongoose.model('Patient', patientSchema);


