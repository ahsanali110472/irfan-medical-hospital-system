import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import AppointmentCounter from '../models/AppointmentCounter.js';
import Doctor from '../models/Doctor.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const PAKISTAN_OFFSET = '+05:00';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const getAppointmentDateTime = (date) => new Date(`${date}T00:00:00${PAKISTAN_OFFSET}`);

const getPakistanToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const normalizeAppointmentPayload = (body) => ({
  patientName: body.patientName?.trim(),
  fees: Number(body.fees),
  doctorId: body.doctorId,
  appointmentDate: body.appointmentDate
});

const validateAppointmentPayload = (payload) => {
  if (!payload.patientName || payload.patientName.length < 2) return 'Patient name is required';
  if (!Number.isFinite(payload.fees) || payload.fees < 0) return 'Valid fees are required';
  if (!mongoose.Types.ObjectId.isValid(payload.doctorId)) return 'Valid doctor is required';
  if (!DATE_RE.test(payload.appointmentDate || '')) return 'Valid appointment date is required';

  const appointmentDateTime = getAppointmentDateTime(payload.appointmentDate);
  if (Number.isNaN(appointmentDateTime.getTime())) return 'Valid appointment date is required';
  if (payload.appointmentDate < getPakistanToday()) return 'Past appointments are not allowed';

  return null;
};

const getNextAppointmentNumber = async (doctorId, appointmentDate) => {
  try {
    const counter = await AppointmentCounter.findOneAndUpdate(
      { doctor: doctorId, appointmentDate },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return counter.sequence;
  } catch (err) {
    if (err?.code !== 11000) throw err;

    const counter = await AppointmentCounter.findOneAndUpdate(
      { doctor: doctorId, appointmentDate },
      { $inc: { sequence: 1 } },
      { new: true }
    );
    return counter.sequence;
  }
};

export const createAppointment = asyncHandler(async (req, res) => {
  const payload = normalizeAppointmentPayload(req.body);
  const error = validateAppointmentPayload(payload);
  if (error) return res.status(400).json({ message: error });

  const doctor = await Doctor.findById(payload.doctorId);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  if (!doctor.isActive) return res.status(400).json({ message: 'Selected doctor is inactive' });

  const appointmentDateTime = getAppointmentDateTime(payload.appointmentDate);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const appointmentNumber = await getNextAppointmentNumber(doctor._id, payload.appointmentDate);

    try {
      const appointment = await Appointment.create({
        patientName: payload.patientName,
        fees: payload.fees,
        doctor: doctor._id,
        appointmentDate: payload.appointmentDate,
        appointmentDateTime,
        appointmentNumber,
        createdBy: req.user._id
      });

      const populated = await Appointment.findById(appointment._id).populate('doctor');
      return res.status(201).json(populated);
    } catch (err) {
      if (err?.code !== 11000 || attempt === 2) throw err;
    }
  }
});

export const listAppointments = asyncHandler(async (req, res) => {
  const { date, doctorId, status, from, to } = req.query;
  const filter = {};

  if (date) filter.appointmentDate = date;
  if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) filter.doctor = doctorId;
  if (status && ['scheduled', 'completed', 'cancelled'].includes(status)) filter.status = status;
  if (from || to) {
    filter.appointmentDateTime = {};
    if (from) filter.appointmentDateTime.$gte = getAppointmentDateTime(from);
    if (to) filter.appointmentDateTime.$lte = getAppointmentDateTime(to);
  }

  const appointments = await Appointment.find(filter)
    .populate('doctor')
    .sort({ appointmentDate: -1, appointmentNumber: 1 })
    .limit(300);

  res.json(appointments);
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid appointment status' });
  }

  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('doctor');

  if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
  res.json(appointment);
});
