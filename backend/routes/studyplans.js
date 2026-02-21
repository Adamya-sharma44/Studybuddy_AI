const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const StudyPlan = require('../models/StudyPlan');
const auth = require('../middleware/auth');

// NOTE:
// - On AWS App Runner (Linux), the service must be able to start even if optional
//   env vars like OPENAI_API_KEY are not configured yet.
// - The OpenAI SDK throws at construction time if apiKey is missing, so we
//   instantiate lazily per-request.
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// @route   POST /api/study-plans/generate
// @desc    Generate AI-powered study plan
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({
        success: false,
        message: 'AI study plan generation is not configured on this server (missing OPENAI_API_KEY).'
      });
    }

    // Get all pending assignments
    const assignments = await Assignment.find({
      user: req.userId,
      isCompleted: false
    })
      .populate('subject', 'name code')
      .sort({ dueDate: 1 });

    if (assignments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending assignments found. Add some assignments to generate a study plan.'
      });
    }

    // Prepare data for AI
    const assignmentsData = assignments.map(a => ({
      title: a.title,
      subject: a.subject.name,
      type: a.type,
      dueDate: a.dueDate.toISOString().split('T')[0],
      priority: a.priority,
      estimatedHours: a.estimatedHours,
      progress: a.progress
    }));

    const currentDate = new Date().toISOString().split('T')[0];

    // Create prompt for OpenAI
    const prompt = `You are an expert study planner for university students. Create a detailed, personalized study plan based on the following assignments:

${JSON.stringify(assignmentsData, null, 2)}

Current date: ${currentDate}

Generate a study plan that:
1. Prioritizes assignments based on due dates and priority levels
2. Distributes study sessions evenly throughout the week
3. Allocates appropriate time based on estimated hours
4. Considers current progress on assignments
5. Includes breaks and doesn't schedule too many hours per day (max 6 hours)
6. Provides specific study tips for each session

Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:
{
  "title": "Study Plan Title",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "sessions": [
    {
      "assignmentTitle": "Assignment title",
      "subjectName": "Subject name",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM AM/PM",
      "endTime": "HH:MM AM/PM",
      "duration": 90,
      "topic": "Specific topic to study",
      "description": "What to focus on",
      "tips": ["tip1", "tip2"]
    }
  ],
  "aiGeneratedInsights": {
    "summary": "Brief overview of the study plan",
    "recommendations": ["recommendation1", "recommendation2"],
    "estimatedTotalHours": 20,
    "priorityFocus": "Which assignments need most attention"
  }
}`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful study planning assistant. You MUST respond with valid JSON only, no markdown formatting or code blocks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    let aiResponse = completion.choices[0].message.content.trim();
    
    // Remove markdown code blocks if present
    aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const planData = JSON.parse(aiResponse);

    // Map sessions to assignments
    const sessionsWithRefs = await Promise.all(
      planData.sessions.map(async (session) => {
        const assignment = assignments.find(
          a => a.title === session.assignmentTitle && a.subject.name === session.subjectName
        );

        return {
          assignment: assignment?._id,
          subject: assignment?.subject._id,
          date: new Date(session.date),
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          topic: session.topic,
          description: session.description || '',
          tips: session.tips || []
        };
      })
    );

    // Create study plan
    const studyPlan = new StudyPlan({
      user: req.userId,
      title: planData.title || 'AI-Generated Study Plan',
      startDate: new Date(planData.startDate),
      endDate: new Date(planData.endDate),
      sessions: sessionsWithRefs,
      aiGeneratedInsights: planData.aiGeneratedInsights
    });

    await studyPlan.save();
    await studyPlan.populate('sessions.assignment sessions.subject');

    res.status(201).json({
      success: true,
      message: 'Study plan generated successfully',
      data: {
        studyPlan
      }
    });
  } catch (error) {
    console.error('Generate study plan error:', error);
    
    if (error instanceof SyntaxError) {
      return res.status(500).json({
        success: false,
        message: 'Error parsing AI response. Please try again.',
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error generating study plan',
      error: error.message
    });
  }
});

// @route   GET /api/study-plans
// @desc    Get all study plans for logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const studyPlans = await StudyPlan.find({ user: req.userId })
      .populate('sessions.assignment sessions.subject')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        studyPlans,
        count: studyPlans.length
      }
    });
  } catch (error) {
    console.error('Get study plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study plans',
      error: error.message
    });
  }
});

// @route   GET /api/study-plans/:id
// @desc    Get a specific study plan
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOne({
      _id: req.params.id,
      user: req.userId
    }).populate('sessions.assignment sessions.subject');

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    res.json({
      success: true,
      data: {
        studyPlan
      }
    });
  } catch (error) {
    console.error('Get study plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching study plan',
      error: error.message
    });
  }
});

// @route   DELETE /api/study-plans/:id
// @desc    Delete a study plan
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const studyPlan = await StudyPlan.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!studyPlan) {
      return res.status(404).json({
        success: false,
        message: 'Study plan not found'
      });
    }

    res.json({
      success: true,
      message: 'Study plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete study plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting study plan',
      error: error.message
    });
  }
});

module.exports = router;
