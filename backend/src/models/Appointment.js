import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    fees: { type: Number, required: true, min: 0 },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: String, required: true },
    appointmentDateTime: { type: Date, required: true },
    appointmentNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, appointmentNumber: 1 },
  { unique: true }
);
appointmentSchema.index({ doctor: 1, appointmentDate: 1 });

export default mongoose.model('Appointment', appointmentSchema);
