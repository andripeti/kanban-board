import mongoose from 'mongoose'

const { Schema } = mongoose

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true })

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)

export default Task
