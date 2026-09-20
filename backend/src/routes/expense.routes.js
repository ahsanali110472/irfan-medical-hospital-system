import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { createExpense, listExpenses } from '../controllers/expense.controller.js';

const router = Router();
router.use(protect);

router.post('/', authorize('admin'), createExpense);
router.get('/', authorize('admin'), listExpenses);

export default router;





