import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - try .env.production first, then .env
const prodEnvPath = path.join(__dirname, '..', '.env.production');
const devEnvPath = path.join(__dirname, '..', '.env');

// Try production first, then development
dotenv.config({ path: prodEnvPath });
dotenv.config({ path: devEnvPath });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import cron from 'node-cron';

import { connectDb } from './utils/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import patientRoutes from './routes/patient.routes.js';
import billRoutes from './routes/bill.routes.js';
import roomRoutes from './routes/room.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import reportRoutes from './routes/report.routes.js';
import agentRoutes from './routes/agent.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import { cleanupDoctorIndexes } from './models/Doctor.js';
import { errorHandler, notFound } from './utils/error.js';
import { generateDailyClosingReport } from './services/closing.service.js';

const app = express();

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: ['file://', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

process.on('EPIPE', () => {
  console.log('EPIPE error caught, ignoring');
});

// DB connect and start server
connectDb()
  .then(async () => {
    await cleanupDoctorIndexes();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server accessible at http://127.0.0.1:${PORT}`);
      console.log(`Server accessible at http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Either stop the other process or set PORT to a free port in backend/.env`);
        process.exit(1);
      }
      console.error('Server error:', err);
    });

    // Schedule daily closing at 12:00 AM server local time
    cron.schedule('0 0 * * *', async () => {
      try {
        await generateDailyClosingReport();
        console.log('Daily closing report generated');
      } catch (err) {
        console.error('Failed to generate daily closing report', err);
      }
    });
  })
  .catch((err) => {
    console.error('Failed to connect to database', err);
    process.exit(1);
  });
