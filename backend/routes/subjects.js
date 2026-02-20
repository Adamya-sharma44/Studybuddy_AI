const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const subjectValidation = [
  body('name').trim().notEmpty().withMessage('Subject name is required').isLength({ max: 100 }),
  body('code').optional().trim().isLength({ max: 20 }),
  body('instructor').optional().trim().isLength({ max: 100 }),
  body('credits').optional().isInt({ min: 0, max: 10 }),
  body('color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid color format')
];

// @route   GET /api/subjects
// @desc    Get all subjects for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        subjects,
        count: subjects.length
      }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subjects',
      error: error.message
    });
  }
});

// @route   POST /api/subjects
// @desc    Create a new subject
// @access  Private
router.post('/', auth, subjectValidation, validate, async (req, res) => {
  try {
    const { name, code, instructor, credits, color } = req.body;

    const subject = new Subject({
      user: req.userId,
      name,
      code: code || '',
      instructor: instructor || '',
      credits: credits || 0,
      color: color || '#6366f1'
    });

    await subject.save();

    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        subject
      }
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subject',
      error: error.message
    });
  }
});

// @route   GET /api/subjects/:id
// @desc    Get a specific subject
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      user: req.userId
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      data: {
        subject
      }
    });
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subject',
      error: error.message
    });
  }
});

// @route   PUT /api/subjects/:id
// @desc    Update a subject
// @access  Private
router.put('/:id', auth, subjectValidation, validate, async (req, res) => {
  try {
    const { name, code, instructor, credits, color } = req.body;

    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, code, instructor, credits, color },
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: {
        subject
      }
    });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subject',
      error: error.message
    });
  }
});

// @route   DELETE /api/subjects/:id
// @desc    Delete a subject
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Also delete all assignments for this subject
    await Assignment.deleteMany({ subject: req.params.id, user: req.userId });

    res.json({
      success: true,
      message: 'Subject and associated assignments deleted successfully'
    });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subject',
      error: error.message
    });
  }
});

module.exports = router;