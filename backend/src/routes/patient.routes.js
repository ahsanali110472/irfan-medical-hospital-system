import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { createPatient, listPatients, getPatient, updatePatient, deletePatient, getPatientsForBilling } from '../controllers/patient.controller.js';

const router = Router();
router.use(protect);

router.post('/', authorize('admin', 'receptionist'), createPatient);
router.get('/', authorize('admin', 'receptionist'), listPatients);
router.get('/billing/unpaid', authorize('admin', 'receptionist'), getPatientsForBilling);
router.get('/:id', authorize('admin', 'receptionist'), getPatient);
router.put('/:id', authorize('admin', 'receptionist'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient); // New delete route

export default router;
