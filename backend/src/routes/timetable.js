const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetable');

// Timetable generation and display routes
router.post('/generate', timetableController.generateTimetable);
router.get('/view/:branchId/:semester', timetableController.viewTimetable);
router.get('/view-professor/:professorId', timetableController.viewProfessorTimetable);
router.get('/check-conflicts/:branchId/:semester', timetableController.checkConflicts);
router.get('/conflicts/:branchId/:semester', timetableController.getConflicts);
router.post('/validate', timetableController.validateTimetable);
router.delete('/clear/:branchId/:semester', timetableController.clearTimetable);
router.put('/adjust/:timetableId', timetableController.adjustSlot);

module.exports = router;
