import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

export const cleanupDoctorIndexes = async () => {
  const legacyIndexes = ['phone_1', 'email_1'];

  for (const indexName of legacyIndexes) {
    try {
      await Doctor.collection.dropIndex(indexName);
      console.log(`Dropped legacy doctors index: ${indexName}`);
    } catch (error) {
      if (error?.codeName !== 'IndexNotFound' && error?.code !== 27) {
        console.warn(`Could not drop legacy doctors index ${indexName}:`, error.message);
      }
    }
  }
};

export default Doctor;
