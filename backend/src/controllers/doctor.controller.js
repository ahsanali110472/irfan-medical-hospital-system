import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const normalizeDoctorPayload = (body) => {
  const payload = {
    name: body.name?.trim(),
    specialization: body.specialization?.trim(),
    isActive: typeof body.isActive === 'boolean' ? body.isActive : true
  };

  return payload;
};

const validateDoctor = (payload) => {
  if (!payload.name || payload.name.length < 2) return 'Doctor name is required';
  if (!payload.specialization || payload.specialization.length < 2) return 'Specialization is required';
  return null;
};

export const createDoctor = asyncHandler(async (req, res) => {
  const payload = normalizeDoctorPayload(req.body);
  const error = validateDoctor(payload);
  if (error) return res.status(400).json({ message: error });

  const duplicate = await Doctor.findOne({
    name: { $regex: `^${payload.name}$`, $options: 'i' },
    specialization: { $regex: `^${payload.specialization}$`, $options: 'i' }
  });
  if (duplicate) {
    return res.status(400).json({ message: 'Doctor with this name and specialization already exists' });
  }

  const doctor = await Doctor.create(payload);
  res.status(201).json(doctor);
});

export const listDoctors = asyncHandler(async (req, res) => {
  const { active, q } = req.query;
  const filter = {};

  if (active === 'true') filter.isActive = true;
  if (active === 'false') filter.isActive = false;
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { specialization: { $regex: q, $options: 'i' } }
    ];
  }

  const doctors = await Doctor.find(filter).sort({ isActive: -1, name: 1 });
  res.json(doctors);
});

export const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const payload = normalizeDoctorPayload(req.body);
  const error = validateDoctor(payload);
  if (error) return res.status(400).json({ message: error });

  const duplicate = await Doctor.findOne({
    _id: { $ne: req.params.id },
    name: { $regex: `^${payload.name}$`, $options: 'i' },
    specialization: { $regex: `^${payload.specialization}$`, $options: 'i' }
  });
  if (duplicate) {
    return res.status(400).json({ message: 'Doctor with this name and specialization already exists' });
  }

  const doctor = await Doctor.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json(doctor);
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const appointmentCount = await Appointment.countDocuments({ doctor: req.params.id });
  if (appointmentCount > 0) {
    return res.status(400).json({ message: 'Cannot delete doctor with existing appointments. Mark inactive instead.' });
  }

  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
  res.json({ success: true });
});
