import { Router } from 'express';
import { authorize, protect } from '../middleware/auth.js';
import { createRoom, listRooms, updateRoom, deleteRoom } from '../controllers/room.controller.js';

const router = Router();
router.use(protect);

router.post('/', authorize('admin'), createRoom);
router.get('/', authorize('admin', 'receptionist'), listRooms);
router.put('/:id', authorize('admin'), updateRoom);
router.delete('/:id', authorize('admin'), deleteRoom);

export default router;





