import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    maxlength: [100, 'Team name cannot be more than 100 characters'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  members: [{
const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'po', 'member'],
      default: 'member',
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

TeamSchema.pre('save', function(next) {
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

TeamSchema.index({ userId: 1, name: 1 }, { unique: true });

TeamSchema.pre('save', function preSave(next) {
  this.updatedAt = Date.now();
  next();
});

TeamSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
