import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    features: [{ type: String }],
    price: { type: Number, required: true },
    type: { type: String, enum: ['ward', 'private', 'xray', 'ultrasound', 'ot', 'test'], required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);





