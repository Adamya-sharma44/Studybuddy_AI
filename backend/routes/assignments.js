const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const assignmentValidation = [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('type').optional().isIn(['homework', 'project', 'exam', 'quiz', 'presentation', 'other']),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('estimatedHours').optional().isFloat({ min: 0.5, max: 100 })
];

// @route   GET /api/assignments
// @desc    Get all assignments for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, subject } = req.query;
    
    let query = { user: req.userId };
    
    if (status === 'completed') {
      query.isCompleted = true;
    } else if (status === 'pending') {
      query.isCompleted = false;
    }
    
    if (subject) {
      query.subject = subject;
    }

    const assignments = await Assignment.find(query)
      .populate('subject', 'name code color')
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: {
        assignments,
        count: assignments.length
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignments',
      error: error.message
    });
  }
});

// @route   POST /api/assignments
// @desc    Create a new assignment
// @access  Private
router.post('/', auth, assignmentValidation, validate, async (req, res) => {
  try {
    const { subject, title, description, type, dueDate, priority, estimatedHours } = req.body;

    // Verify subject belongs to user
    const subjectExists = await Subject.findOne({
      _id: subject,
      user: req.userId
    });

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const assignment = new Assignment({
      user: req.userId,
      subject,
      title,
      description: description || '',
      type: type || 'homework',
      dueDate,
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 2
    });

    await assignment.save();
    await assignment.populate('subject', 'name code color');

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assignment',
      error: error.message
    });
  }
});

// @route   GET /api/assignments/:id
// @desc    Get a specific assignment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('subject', 'name code color');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assignment',
      error: error.message
    });
  }
});

// @route   PUT /api/assignments/:id
// @desc    Update an assignment
// @access  Private
router.put('/:id', auth, assignmentValidation, validate, async (req, res) => {
  try {
    const { subject, title, description, type, dueDate, priority, estimatedHours } = req.body;

    // Verify subject belongs to user
    const subjectExists = await Subject.findOne({
      _id: subject,
      user: req.userId
    });

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { subject, title, description, type, dueDate, priority, estimatedHours },
      { new: true, runValidators: true }
    ).populate('subject', 'name code color');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assignment',
      error: error.message
    });
  }
});

// @route   PATCH /api/assignments/:id/progress
// @desc    Update assignment progress
// @access  Private
router.patch('/:id/progress', auth, [
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100')
], validate, async (req, res) => {
  try {
    const { progress } = req.body;

    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { progress },
      { new: true, runValidators: true }
    ).populate('subject', 'name code color');

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: {
        assignment
      }
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating progress',
      error: error.message
    });
  }
});

// @route   DELETE /api/assignments/:id
// @desc    Delete an assignment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assignment',
      error: error.message
    });
  }
});

module.exports = router;