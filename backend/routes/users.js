import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import permit from '../middleware/permit.js';

const router = express.Router();

/* ===============================
   ☁️ Cloudinary Configuration
   =============================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ===============================
   📦 Multer + Cloudinary Storage
   =============================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }],
  },
});
const upload = multer({ storage });

/* ===============================
   🚀 Upload / Replace Avatar
   =============================== */
router.post('/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Delete old avatar if exists
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (delErr) {
        console.warn('Failed to delete old avatar:', delErr.message);
      }
    }

    // ✅ Save new avatar info
    user.avatarUrl = req.file.path;
    user.avatarPublicId = req.file.filename || req.file.public_id; // depends on version
    await user.save();

    res.json({
      message: 'Avatar uploaded successfully',
      user: user.toObject({ versionKey: false, transform: (_, ret) => delete ret.passwordHash }),
    });
  } catch (err) {
    console.error('Error uploading avatar:', err);
    res.status(500).json({ message: 'Failed to upload avatar' });
  }
});

/* ===============================
   👥 Get All Users (Admin Only)
   =============================== */
router.get('/', auth, permit('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json(users);
  } catch (err) {
    console.error('Error loading users:', err);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

/* ===============================
   🙋 Get Current User Profile
   =============================== */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error loading profile:', err);
    res.status(500).json({ message: 'Failed to load profile' });
  }
});

/* ===============================
   ❌ Delete User (Admin Only)
   =============================== */
router.delete('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ✅ Delete user avatar from Cloudinary
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.warn('Failed to delete user avatar:', err.message);
      }
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===============================
   🔁 Update User Role (Admin Only)
   =============================== */
router.put('/:id/role', auth, permit('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'employee'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(500).json({ message: 'Failed to update role' });
  }
});

export default router;
