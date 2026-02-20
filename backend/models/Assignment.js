const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['homework', 'project', 'exam', 'quiz', 'presentation', 'other'],
    default: 'homework'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  estimatedHours: {
    type: Number,
    min: [0.5, 'Estimated hours must be at least 0.5'],
    max: [100, 'Estimated hours cannot exceed 100'],
    default: 2
  },
  progress: {
    type: Number,
    min: [0, 'Progress cannot be negative'],
    max: [100, 'Progress cannot exceed 100'],
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Automatically set isCompleted when progress reaches 100
assignmentSchema.pre('save', function(next) {
  if (this.progress >= 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  } else if (this.progress < 100 && this.isCompleted) {
    this.isCompleted = false;
    this.completedAt = null;
  }
  next();
});

// Create indexes for faster queries
assignmentSchema.index({ user: 1, dueDate: 1 });
assignmentSchema.index({ user: 1, isCompleted: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);