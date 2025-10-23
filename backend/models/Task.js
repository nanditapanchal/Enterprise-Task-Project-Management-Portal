import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: String,
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priority: { type: String, enum: ['Low','Medium','High'], default: 'Medium' },
  status: { type: String, enum: ['To-Do','In Progress','Done'], default: 'To-Do' },
  deadline: Date,
  progress: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Task', taskSchema);
