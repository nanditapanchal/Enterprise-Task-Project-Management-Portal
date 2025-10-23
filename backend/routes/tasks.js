import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Create task under project
router.post('/:projectId', auth, async (req, res) => {
  try {
    const { title, description, assignee, priority, status, deadline } = req.body;
    const task = await Task.create({ projectId: req.params.projectId, title, description, assignee, priority, status, deadline });
    res.json(task);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
});

// Get task
router.get('/task/:id', auth, async (req, res) => {
  const task = await Task.findById(req.params.id).populate('assignee', 'name email');
  res.json(task);
});

// Update task
router.put('/task/:id', auth, async (req, res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(task);
});

// Delete
router.delete('/task/:id', auth, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// Get tasks for project
router.get('/project/:projectId', auth, async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId }).populate('assignee', 'name email');
  res.json(tasks);
});

export default router;
