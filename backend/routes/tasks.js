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
router.put('/:id', auth, async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) return res.status(404).json({ message: 'Task not found' });

  // Only admin or assigned user can update
  if (req.user.role !== 'admin' && task.assignee.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updatedTask);
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) return res.status(404).json({ message: 'Task not found' });

  // Only admin or assigned user can delete
  if (req.user.role !== 'admin' && task.assignee.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await Task.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// Get all tasks (admin)
router.get('/all', auth, permit('admin'), async (req, res) => {
  const tasks = await Task.find()
    .populate('assignee', 'name email role')
    .populate('projectId', 'name');
  res.json(tasks);
});

// Get tasks for project
router.get('/project/:projectId', auth, async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId }).populate('assignee', 'name email');
  res.json(tasks);
});

export default router;
