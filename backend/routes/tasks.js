import express from 'express';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
import permit from '../middleware/permit.js';

const router = express.Router();

/* ===========================
   🔹 CREATE TASK (Admin only)
   POST /api/tasks/:projectId
   =========================== */
router.post('/:projectId', auth, permit('admin'), async (req, res) => {
  try {
    const { title, description, assignee, priority, status, deadline } = req.body;

    // Only assign if assignee is provided
    const taskData = {
      projectId: req.params.projectId,
      title,
      description,
      priority,
      status,
      deadline,
    };

    if (assignee && assignee.trim() !== '') {
      taskData.assignee = assignee; // should be ObjectId
    }

    const task = await Task.create(taskData);
    res.json(task);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ==========================================
   🔹 GET ALL TASKS (Admin)
   GET /api/tasks/all
   ========================================== */
router.get('/all', auth, permit('admin'), async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate('assignee', 'name email role')
      .populate('projectId', 'name');
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching all tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =================================================
   🔹 GET TASKS FOR A SPECIFIC PROJECT (Admin/Employee)
   GET /api/tasks/project/:projectId
   ================================================= */
// GET /api/tasks/project/:id
router.get('/project/:id', auth, async (req, res) => {
  try {
    const filter = { projectId: req.params.id };
    if (req.user.role !== 'admin') {
      filter.assignee = req.user.id; // employee sees only their tasks
    }

    const tasks = await Task.find(filter)
      .populate('assignee', 'name')
      .populate('projectId', 'name');
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

/* ==========================================
   🔹 GET TASKS ASSIGNED TO CURRENT USER
   GET /api/tasks/
   ========================================== */
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user.id })
      .populate('assignee', 'name email role')
      .populate('projectId', 'name');
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching user tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ==========================================
   🔹 GET SINGLE TASK BY ID (Authorized user)
   GET /api/tasks/task/:id
   ========================================== */
router.get('/task/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignee', 'name email');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('Error fetching task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ==========================================
   🔹 UPDATE TASK (Admin or Assigned Employee)
   PUT /api/tasks/:id
   ========================================== */
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && (!task.assignee || task.assignee.toString() !== req.user.id))
      return res.status(403).json({ message: 'Forbidden' });

    // Whitelist fields to avoid schema validation errors
    const allowedFields = ['title', 'description', 'status', 'assignee', 'dueDate'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, updates, { new: true });

    // Emit real-time update if project exists
  if (updatedTask.projectId) {
  const io = req.app.get('io');
  if (io && typeof io.to === 'function') {
    try {
      io.to(updatedTask.projectId.toString()).emit('taskUpdated', updatedTask);
    } catch (err) {
      console.error('Error emitting task update:', err);
    }
  }
}

    res.json(updatedTask);
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ==========================================
   🔹 DELETE TASK (Admin or Assigned Employee)
   DELETE /api/tasks/:id
   ========================================== */
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role !== 'admin' && task.assignee.toString() !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ==========================================
   🔹 GET MY TASKS (Shortcut for Employee)
   GET /api/tasks/my-tasks
   ========================================== */
// GET /api/tasks/my-tasks
router.get('/my-tasks', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignee: req.user.id })
      .populate('projectId', 'name')
      .populate('assignee', 'name');
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch assigned tasks' });
  }
});

export default router;
