
import Patient from '../models/Patient.js';
import Bill from '../models/Bill.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createPatient = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  
  // Normalize gender
  if (typeof payload.gender === 'string') {
    const g = payload.gender.trim().toLowerCase();
    if (['male','female','other'].includes(g)) payload.gender = g;
  }

  // Process assignedProviders data
  if (payload.assignedProviders) {
    const providers = payload.assignedProviders;
    
    // Convert all fee fields to numbers
    if (providers.doctorFee) providers.doctorFee = Number(providers.doctorFee);
    if (providers.otTechnicianFee) providers.otTechnicianFee = Number(providers.otTechnicianFee);
    if (providers.anesthesiaDoctorFee) providers.anesthesiaDoctorFee = Number(providers.anesthesiaDoctorFee);
  }

  // Process visit data
  if (payload.visit) {
    const visit = payload.visit;
    // Ensure testIds is an array
    if (visit.testIds && !Array.isArray(visit.testIds)) {
      visit.testIds = [visit.testIds].filter(Boolean);
    }
    if (typeof visit.roomFeatures === 'string') {
      visit.roomFeatures = visit.roomFeatures.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (visit.roomFee) {
      visit.roomFee = Number(visit.roomFee);
    }
  }

  // Handle agent commission calculations
  if (payload.totalAmountReceived) {
    payload.totalAmountReceived = Number(payload.totalAmountReceived);
    
    // Calculate agent commission if agent is provided
    if (payload.agentName) {
      // Get agent commission rate (assuming 10% default, can be made configurable)
      const commissionRate = 0.10; // 10%
      payload.agentCommission = payload.totalAmountReceived * commissionRate;
      payload.netAmountAfterCommission = payload.totalAmountReceived - payload.agentCommission;
    } else {
      payload.agentCommission = 0;
      payload.netAmountAfterCommission = payload.totalAmountReceived;
    }
    
    // Set current balance to net amount after commission
    payload.currentBalance = payload.netAmountAfterCommission;
    // Initialize dues to 0 (will be calculated when bill is created)
    payload.dues = 0;
  } else {
    payload.totalAmountReceived = 0;
    payload.agentCommission = 0;
    payload.netAmountAfterCommission = 0;
    payload.currentBalance = 0;
    payload.dues = 0;
  }

  const patient = await Patient.create(payload);
  res.status(201).json(patient);
});

export const listPatients = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { contact: { $regex: q, $options: 'i' } },
          { cnic: { $regex: q, $options: 'i' } },
          { address: { $regex: q, $options: 'i' } }
        ]
      }
    : {};
  const patients = await Patient.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(patients);
});

export const getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
});

export const updatePatient = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (typeof payload.gender === 'string') {
    const g = payload.gender.trim().toLowerCase();
    if (['male','female','other'].includes(g)) payload.gender = g;
  }
  if (payload.visit) {
    const visit = payload.visit;
    if (visit.roomFee) {
      visit.roomFee = Number(visit.roomFee);
    }
    if (typeof visit.roomFeatures === 'string') {
      visit.roomFeatures = visit.roomFeatures.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  const patient = await Patient.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!patient) return res.status(404).json({ message: 'Patient not found' });
  res.json(patient);
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patientId = req.params.id;

  const billCount = await Bill.countDocuments({ patient: patientId });

  if (billCount > 0) {
    return res.status(400).json({ message: 'Cannot delete patient with existing bills.' });
  }

  const patient = await Patient.findByIdAndDelete(patientId);
  if (!patient) return res.status(404).json({ message: 'Patient not found' });

  res.json({ message: 'Patient deleted successfully' });
});

export const getPatientsForBilling = asyncHandler(async (req, res) => {
  // Get all patients who have any bills (paid or unpaid)
  const patientsWithBills = await Bill.aggregate([
    { $group: { _id: '$patient' } }
  ]);
  
  const patientIdsWithBills = patientsWithBills.map(p => p._id);
  
  // Get only patients who have NO bills at all
  const patients = await Patient.find({
    _id: { $nin: patientIdsWithBills }
  }).sort({ createdAt: -1 });
  
  res.json(patients);
});
