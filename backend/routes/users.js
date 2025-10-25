import express from 'express';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import permit from '../middleware/permit.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', auth, permit('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});
// Delete user (admin only)
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/:id/role', auth, permit('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

export default router;
