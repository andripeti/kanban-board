import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: [120, 'Project name cannot exceed 120 characters'],
    },
    icon: {
      type: String,
      default: '',
    },
    teamIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

ProjectSchema.index({ userId: 1, name: 1 }, { unique: true });

ProjectSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);