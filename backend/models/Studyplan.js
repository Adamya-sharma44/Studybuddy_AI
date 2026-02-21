// Backward/compat shim for case-sensitive filesystems (Linux/App Runner).
// Keep this filename so any legacy `require('../models/Studyplan')` continues
// to work, while the canonical model lives in `StudyPlan.js`.
module.exports = require('./StudyPlan');

