import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { summary, closing, timeseries, todaySummary, allTimeSummary } from '../controllers/report.controller.js';

const router = Router();
router.use(protect);

router.get('/summary', authorize('admin', 'receptionist'), summary);
router.get('/closing', authorize('admin', 'receptionist'), closing);
router.get('/timeseries', authorize('admin', 'receptionist'), timeseries);
router.get('/today', authorize('admin', 'receptionist'), todaySummary);
router.get('/alltime', authorize('admin', 'receptionist'), allTimeSummary);

export default router;


