import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import {
  createAppointment,
  listAppointments,
  updateAppointmentStatus
} from '../controllers/appointment.controller.js';

const router = Router();
router.use(protect);

router.post('/', authorize('admin', 'receptionist'), createAppointment);
router.get('/', authorize('admin', 'receptionist'), listAppointments);
router.patch('/:id/status', authorize('admin', 'receptionist'), updateAppointmentStatus);

export default router;
