import dns from 'dns';
import dotenv from 'dotenv';

dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
]);

dotenv.config();
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Room from '../src/models/Room.js';

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany({});
  await Room.deleteMany({});

  const admin = await User.create({ name: 'Admin', email: 'admin@gmail.com', password: 'admin123', role: 'admin' });
  const receptionist = await User.create({ name: 'Reception', email: 'reception@gmail.com', password: 'reception123', role: 'receptionist' });

  await Room.insertMany([
    { name: 'General Ward', features: ['Shared'], price: 1000, type: 'ward' },
    { name: 'Private Room', features: ['AC', 'TV'], price: 3000, type: 'private' },
    { name: 'X-Ray', features: ['Standard X-Ray'], price: 800, type: 'xray' },
    { name: 'Ultrasound', features: ['ABDOMINAL'], price: 1200, type: 'ultrasound' },
    { name: 'Operation Theater', features: ['OT'], price: 5000, type: 'ot' }
  ]);

  console.log('Seeded users and rooms:', admin.email, receptionist.email);
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});





