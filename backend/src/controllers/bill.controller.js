// import dayjs from 'dayjs';
// import Bill from '../models/Bill.js';
// import Patient from '../models/Patient.js';
// import Room from '../models/Room.js';

// const generateBillNumber = async () => {
//   const dateStr = dayjs().format('YYYYMMDD');
//   const prefix = `HSP-${dateStr}`;
//   const last = await Bill.find({ billNumber: { $regex: `^${prefix}-` } })
//     .sort({ createdAt: -1 })
//     .limit(1);
//   const lastSeq = last[0]?.billNumber?.split('-')[2] || '0000';
//   const nextSeq = String(parseInt(lastSeq, 10) + 1).padStart(4, '0');
//   return `${prefix}-${nextSeq}`;
// };

// // Generate bill entirely from patient visit selection
// export const createBill = async (req, res) => {
//   const { patientId } = req.body;
//   const patient = await Patient.findById(patientId);
//   if (!patient) return res.status(404).json({ message: 'Patient not found' });
//   const visit = patient.visit || {};
//   const items = [];
//   if (visit.doctorName && visit.doctorFee) items.push({ description: `Doctor: ${visit.doctorName}`, amount: Number(visit.doctorFee), category: 'doctor' });
//   if (visit.otTechnicianName && visit.otTechnicianFee) items.push({ description: `OT Technician: ${visit.otTechnicianName}`, amount: Number(visit.otTechnicianFee), category: 'otTechnician' });
//   if (visit.anesthesiaDoctorName && visit.anesthesiaDoctorFee) items.push({ description: `Anesthesia: ${visit.anesthesiaDoctorName}`, amount: Number(visit.anesthesiaDoctorFee), category: 'anesthesia' });
//   // For tests
//   if (Array.isArray(visit.testIds) && visit.testIds.length) {
//     const tests = await Room.find({ _id: { $in: visit.testIds } });
//     for (const t of tests) {
//       const category = t.type === 'xray' ? 'xray' : 'ultrasound';
//       items.push({ description: t.name, amount: Number(t.price || 0), category });
//     }
//   }
//   // Room base charge is optional: include if provided as a positive number in visit.roomFeatures? Typically price from a separate catalog; here we just record name/features
//   const visitInfo = {
//     roomName: visit.roomName,
//     roomFeatures: visit.roomFeatures,
//     otTechnicianName: visit.otTechnicianName,
//     otTechnicianFee: visit.otTechnicianFee,
//     anesthesiaDoctorName: visit.anesthesiaDoctorName,
//     anesthesiaDoctorFee: visit.anesthesiaDoctorFee,
//     doctorName: visit.doctorName,
//     doctorFee: visit.doctorFee
//   };

//   const totalAmount = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
//   const billNumber = await generateBillNumber();
//   const bill = await Bill.create({
//     billNumber,
//     patient: patient._id,
//     visitInfo,
//     items,
//     totalAmount,
//     createdBy: req.user._id
//   });
//   res.status(201).json(bill);
// };

// export const listBills = async (req, res) => {
//   const { status } = req.query;
//   const filter = status ? { status } : {};
//   const bills = await Bill.find(filter).populate('patient').sort({ createdAt: -1 }).limit(200);
//   res.json(bills);
// };

// export const getBill = async (req, res) => {
//   const bill = await Bill.findById(req.params.id).populate('patient');
//   if (!bill) return res.status(404).json({ message: 'Bill not found' });
//   res.json(bill);
// };

// export const markBillPaid = async (req, res) => {
//   const bill = await Bill.findById(req.params.id);
//   if (!bill) return res.status(404).json({ message: 'Bill not found' });
//   if (bill.status === 'paid') return res.status(400).json({ message: 'Bill already paid and locked' });
//   bill.status = 'paid';
//   bill.paidAt = new Date();
//   await bill.save();
//   res.json(bill);
// };

// export const updateBill = async (req, res) => {
//   const bill = await Bill.findById(req.params.id);
//   if (!bill) return res.status(404).json({ message: 'Bill not found' });
//   if (bill.status === 'paid') return res.status(400).json({ message: 'Paid bills are immutable' });
//   const { items } = req.body;
//   bill.items = items;
//   bill.totalAmount = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
//   await bill.save();
//   res.json(bill);
// };

// // New delete function
// export const deleteBill = async (req, res) => {
//   const bill = await Bill.findByIdAndDelete(req.params.id);
//   if (!bill) return res.status(404).json({ message: 'Bill not found' });
//   res.json({ message: 'Bill deleted successfully' });
// };

import dayjs from 'dayjs';
import Bill from '../models/Bill.js';
import Patient from '../models/Patient.js';
import Room from '../models/Room.js';

const generateBillNumber = async () => {
  const dateStr = dayjs().format('YYYYMMDD');
  const prefix = `HSP-${dateStr}`;
  const last = await Bill.find({ billNumber: { $regex: `^${prefix}-` } })
    .sort({ createdAt: -1 })
    .limit(1);
  const lastSeq = last[0]?.billNumber?.split('-')[2] || '0000';
  const nextSeq = String(parseInt(lastSeq, 10) + 1).padStart(4, '0');
  return `${prefix}-${nextSeq}`;
};

export const createBill = async (req, res) => {
  try {
    const { patientId } = req.body;
    console.log('createBill: patientId', patientId);
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const providers = patient.assignedProviders || {};
    const visit = patient.visit || {};
    console.log('createBill: patient visit', visit);
    const items = [];

    // Add room fee if available
    if (visit.roomName && visit.roomFee) {
      items.push({
        description: `Room: ${visit.roomName}`,
        amount: Number(visit.roomFee) || 0,
        category: 'room'
      });
    }

    // Add doctor fee if available
    if (providers.doctorName && providers.doctorFee) {
      items.push({
        description: `Doctor: ${providers.doctorName}`,
        amount: Number(providers.doctorFee) || 0,
        category: 'doctor'
      });
    }

    // Add OT Technician fee if available
    if (providers.otTechnicianName && providers.otTechnicianFee) {
      items.push({
        description: `OT Technician: ${providers.otTechnicianName}`,
        amount: Number(providers.otTechnicianFee) || 0,
        category: 'otTechnician'
      });
    }

    // Add Anesthesia fee if available
    if (providers.anesthesiaDoctorName && providers.anesthesiaDoctorFee) {
      items.push({
        description: `Anesthesia: ${providers.anesthesiaDoctorName}`,
        amount: Number(providers.anesthesiaDoctorFee) || 0,
        category: 'anesthesia'
      });
    }

    // Add tests if available
    if (Array.isArray(visit.testIds) && visit.testIds.length > 0) {
      const tests = await Room.find({ _id: { $in: visit.testIds } });
      tests.forEach(test => {
        const category = ['xray', 'ultrasound'].includes(test.type) ? test.type : 'test';
        items.push({
          description: test.name,
          amount: Number(test.price) || 0,
          category
        });
      });
    }

        const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const billNumber = await generateBillNumber();

    const bill = await Bill.create({
      billNumber,
      patient: patient._id,
      visitInfo: {
        doctorName: providers.doctorName,
        doctorFee: providers.doctorFee,
        otTechnicianName: providers.otTechnicianName,
        otTechnicianFee: providers.otTechnicianFee,
        anesthesiaDoctorName: providers.anesthesiaDoctorName,
        anesthesiaDoctorFee: providers.anesthesiaDoctorFee,
        testIds: visit.testIds
      },
      items,
      totalAmount,
      createdBy: req.user._id
    });

    // Update patient dues calculation
    const currentBalance = patient.netAmountAfterCommission || patient.currentBalance || 0;
    const newDues = Math.max(0, totalAmount - currentBalance);
    
    await Patient.findByIdAndUpdate(patientId, {
      dues: newDues,
      currentBalance: Math.max(0, currentBalance - totalAmount)
    });

    const populatedBill = await Bill.findById(bill._id).populate('patient');
    res.status(201).json(populatedBill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ message: 'Error creating bill', error: error.message });
  }
};


export const listBills = async (req, res) => {
  try {
    const { status, date, month, year, from, to } = req.query;
    let filter = status ? { status } : {};
    
    // Add date filtering
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    } else if (month) {
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    } else if (year) {
      const startDate = new Date(year + '-01-01');
      const endDate = new Date(year + '-12-31');
      endDate.setDate(endDate.getDate() + 1);
      filter.createdAt = { $gte: startDate, $lt: endDate };
    } else if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        filter.createdAt.$lt = toDate;
      }
    }
    
    const bills = await Bill.find(filter).populate('patient').sort({ createdAt: -1 }).limit(200);
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bills', error: error.message });
  }
};

export const getBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patient');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bill', error: error.message });
  }
};

export const markBillPaid = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate('patient');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'paid') return res.status(400).json({ message: 'Bill already paid and locked' });
    
    const patient = bill.patient;
    
    // When bill is paid, clear dues and move to revenue
    // Update patient dues to 0 since bill is now paid
    patient.dues = Math.max(0, patient.dues - bill.totalAmount);
    await patient.save();
    
    // Mark bill as paid - this will be counted as revenue in reports
    bill.status = 'paid';
    bill.paidAt = new Date();
    await bill.save();
    
    res.json({ 
      bill, 
      remainingDues: patient.dues,
      message: 'Bill paid successfully - moved to revenue' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking bill as paid', error: error.message });
  }
};

export const updateBill = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'paid') return res.status(400).json({ message: 'Paid bills are immutable' });
    const { items } = req.body;
    bill.items = items;
    bill.totalAmount = items.reduce((sum, it) => sum + Number(it.amount || 0), 0);
    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Error updating bill', error: error.message });
  }
};

export const deleteBill = async (req, res) => {
  try {
    console.log('Attempting to delete bill with ID:', req.params.id);
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) {
      console.log('Bill not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Bill not found' });
    }
    console.log('Bill deleted successfully:', bill._id);
    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ message: 'Error deleting bill', error: error.message });
  }
};