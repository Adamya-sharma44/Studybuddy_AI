const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Subject code cannot exceed 20 characters']
  },
  instructor: {
    type: String,
    trim: true,
    maxlength: [100, 'Instructor name cannot exceed 100 characters']
  },
  credits: {
    type: Number,
    min: [0, 'Credits cannot be negative'],
    max: [10, 'Credits cannot exceed 10']
  },
  color: {
    type: String,
    default: '#6366f1',
    match: [/^#[0-9A-F]{6}$/i, 'Please provide a valid hex color']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
subjectSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Subject', subjectSchema);