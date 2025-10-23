import mongoose from 'mongoose';
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  deadline: Date,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attachments: [{ url: String, filename: String }]
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
