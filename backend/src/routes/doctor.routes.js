import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import {
  createDoctor,
  deleteDoctor,
  getDoctor,
  listDoctors,
  updateDoctor
} from '../controllers/doctor.controller.js';

const router = Router();
router.use(protect);

router.get('/', authorize('admin', 'receptionist'), listDoctors);
router.get('/:id', authorize('admin', 'receptionist'), getDoctor);
router.post('/', authorize('admin'), createDoctor);
router.put('/:id', authorize('admin'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);

export default router;
