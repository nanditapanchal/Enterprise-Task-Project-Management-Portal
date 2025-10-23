import express from 'express';
import Project from '../models/Project.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, deadline, members } = req.body;
    const project = await Project.create({ name, description, deadline, members, createdBy: req.user.id });
    res.json(project);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// List projects (simple)
router.get('/', auth, async (req, res) => {
  const projects = await Project.find().populate('members', 'name email');
  res.json(projects);
});

// Get one
router.get('/:id', auth, async (req, res) => {
  const project = await Project.findById(req.params.id).populate('members', 'name email');
  if (!project) return res.status(404).json({ message: 'Not found' });
  res.json(project);
});

// Update
router.put('/:id', auth, async (req, res) => {
  const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete
router.delete('/:id', auth, async (req, res) => {
  await Project.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

export default router;
