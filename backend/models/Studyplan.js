const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  tips: [String]
});

const studyPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    default: 'My Study Plan'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sessions: [studySessionSchema],
  aiGeneratedInsights: {
    summary: String,
    recommendations: [String],
    estimatedTotalHours: Number,
    priorityFocus: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
studyPlanSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('StudyPlan', studyPlanSchema);