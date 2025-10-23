import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import permit from '../middleware/permit.js';

const router = express.Router();

router.get('/', auth, permit('admin'), async (req, res) => {
  const users = await User.find().select('-passwordHash');
  res.json(users);
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  res.json(user);
});
// Update user role (admin only)
router.put('/:id/role', auth, permit('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
  res.json(user);
});


export default router;
