import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { createBill, listBills, getBill, markBillPaid, updateBill, deleteBill } from '../controllers/bill.controller.js';

const router = Router();
router.use(protect);

router.post('/', authorize('admin', 'receptionist'), createBill);
router.get('/', authorize('admin', 'receptionist'), listBills);
router.get('/:id', authorize('admin', 'receptionist'), getBill);
router.put('/:id', authorize('admin'), updateBill);
router.delete('/:id', authorize('admin'), deleteBill); // New delete route
router.post('/:id/pay', authorize('admin', 'receptionist'), markBillPaid);

export default router;
