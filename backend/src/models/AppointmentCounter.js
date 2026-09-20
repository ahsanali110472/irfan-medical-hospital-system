import mongoose from 'mongoose';

const appointmentCounterSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointmentDate: { type: String, required: true },
    sequence: { type: Number, default: 0 }
  },
  { timestamps: true }
);

appointmentCounterSchema.index({ doctor: 1, appointmentDate: 1 }, { unique: true });

export default mongoose.model('AppointmentCounter', appointmentCounterSchema);
