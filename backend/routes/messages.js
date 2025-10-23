import express from 'express';
import Message from '../models/Message.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/project/:projectId', auth, async (req, res) => {
  const messages = await Message.find({ projectId: req.params.projectId }).populate('sender', 'name');
  res.json(messages);
});

router.post('/project/:projectId', auth, async (req, res) => {
  const { text } = req.body;
  const msg = await Message.create({ projectId: req.params.projectId, sender: req.user.id, text });
  res.json(await msg.populate('sender', 'name'));
});

export default router;
