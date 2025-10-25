import express from 'express';
import Project from '../models/Project.js';
import auth from '../middleware/auth.js';
import permit from '../middleware/permit.js';
import Task from '../models/Task.js';
const router = express.Router();

// Admin: get all projects
router.get('/all', auth, permit('admin'), async (req, res) => {
  try {
    const projects = await Project.find().populate('members', 'name email');
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load projects' });
  }
});
// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get projects for logged-in employee
router.get('/my-projects', auth, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin sees all projects
      const projects = await Project.find();
      return res.json(projects);
    } else {
      // Employees: find projects where they're assigned tasks
      const tasks = await Task.find({ assignee: req.user.id }).select('projectId');
      const projectIds = [...new Set(tasks.map(task => task.projectId.toString()))];

      const projects = await Project.find({ _id: { $in: projectIds } });
      res.json(projects);
    }
  } catch (err) {
    console.error('Error fetching employee projects:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Create Project (with members)
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, deadline, members } = req.body;
    const project = await Project.create({
      name,
      description,
      deadline,
      members: members || [],
      createdBy: req.user.id
    });
    res.status(201).json(await project.populate('members', 'name email'));
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User/Admin: get own or assigned projects
router.get('/', auth, async (req, res) => {
  try {
    const { id, role } = req.user;
    let projects;

    if (role === 'admin') {
      projects = await Project.find().populate('members', 'name email');
    } else {
      projects = await Project.find({
        $or: [{ createdBy: id }, { members: id }],
      }).populate('members', 'name email');
    }

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});
router.put('/:id', auth, permit('admin'), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update project' });
  }
});
// Add project (admin only)
router.post('/', auth, permit('admin'), async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.create({
      name,
      description,
      createdBy: req.user.id,
      members,
    });
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create project' });
  }
});
// Get a single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('Error fetching project by ID:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
