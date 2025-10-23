import express from 'express';
import http from 'http';
import { Server as IOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import messageRoutes from './routes/messages.js';



dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET','POST']
  }
});
import aiRoutes from './routes/ai.js';
app.use('/api/ai', aiRoutes);
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io basic chat implementation
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);

  socket.on('joinProject', ({ projectId }) => {
    if (projectId) socket.join(projectId);
  });

  socket.on('leaveProject', ({ projectId }) => {
    if (projectId) socket.leave(projectId);
  });

  socket.on('sendMessage', (msg) => {
    // msg: { projectId, sender, text, createdAt }
    if (!msg || !msg.projectId) return;
    io.to(msg.projectId).emit('newMessage', msg);
  });

  socket.on('disconnect', () => console.log('user disconnected', socket.id));
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, { })
  .then(() => {
    console.log('MongoDB connected ✅');
    server.listen(PORT, () => console.log('Server running on port', PORT));
  })
  .catch(err => console.error(err));
