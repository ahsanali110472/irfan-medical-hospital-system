import { Router } from 'express';
import User from '../models/User.js';
import { authorize, protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', authorize('admin'), async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

router.post('/', authorize('admin'), async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
});

router.put('/:id', authorize('admin'), async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.delete('/:id', authorize('admin'), async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

export default router;





