const Timetable = require('../models/Timetable');
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getStudentTimetable = async (req, res) => {
  try {
    const { branchId, semester } = req.params;
    console.log(`[Student API] getStudentTimetable called: branchId=${branchId}, semester=${semester}`);

    // Get all batches for this branch-semester
    const batchesQuery = `
      SELECT batch_id, batch_number FROM batches 
      WHERE branch_id = $1 AND semester = $2
      ORDER BY batch_number;
    `;

    const batchesResult = await pool.query(batchesQuery, [branchId, semester]);
    const batches = batchesResult.rows;
    console.log(`[Student API] Found ${batches.length} batches`);

    if (batches.length === 0) {
      return res.status(404).json({ error: 'No batches found for this branch-semester' });
    }

    // Get timetable for each batch and flatten
    let allSlots = [];

    for (const batch of batches) {
      console.log(`[Student API] Fetching timetable for batch ${batch.batch_number} (${batch.batch_id})`);
      const timetable = await Timetable.findByBatch(batch.batch_id);
      console.log(`[Student API]   Got ${timetable.length} slots for this batch`);
      
      timetable.forEach(slot => {
        let labLabel = '-';
        if (slot.slot_type === 'LAB') {
          labLabel = batch.batch_number === 1 ? 'Batch A' : 'Batch B';
        }
        
        allSlots.push({
          timetable_id: slot.timetable_id,
          day_of_week: slot.day_of_week,
          time_slot_start: slot.time_slot_start,
          time_slot_end: slot.time_slot_end,
          slot_type: slot.slot_type,
          subject_name: slot.subject_name || 'N/A',
          professor_name: slot.professor_name || 'N/A',
          semester: slot.semester,
          batch_id: slot.batch_id,
          lab_batch: labLabel
        });
      });
    }

    console.log(`[Student API] Returning ${allSlots.length} total slots`);
    res.json({ success: true, data: allSlots });
  } catch (error) {
    console.error(`[Student API] Error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentTimetableByBatch = async (req, res) => {
  try {
    const { branchId, semester, batchId } = req.params;

    // Verify batch belongs to branch-semester
    const verifyQuery = `
      SELECT * FROM batches 
      WHERE batch_id = $1 AND branch_id = $2 AND semester = $3;
    `;

    const verifyResult = await pool.query(verifyQuery, [batchId, branchId, semester]);

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid batch for this branch-semester' });
    }

    const timetable = await Timetable.findByBatch(batchId);

    if (!timetable || timetable.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this batch' });
    }

    const organized = this.organizeTimetable(timetable);
    res.json({ success: true, data: organized });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { branchId, semester } = req.params;

    const query = `
      SELECT a.*, s.name as subject_name, p.name as professor_name
      FROM assignments a
      INNER JOIN subjects s ON a.subject_id = s.subject_id
      INNER JOIN professors p ON a.professor_id = p.professor_id
      INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
      WHERE sb.branch_id = $1 AND s.semester = $2 AND sb.is_applicable = TRUE
      ORDER BY a.due_date DESC;
    `;

    const result = await pool.query(query, [branchId, semester]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAssignmentsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const query = `
      SELECT a.*, p.name as professor_name, s.name as subject_name
      FROM assignments a
      LEFT JOIN professors p ON a.professor_id = p.professor_id
      LEFT JOIN subjects s ON a.subject_id = s.subject_id
      WHERE a.subject_id = $1
      ORDER BY a.due_date DESC;
    `;

    const result = await pool.query(query, [subjectId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    const { branchId, semester, feedbackText, rating, feedbackType } = req.body;

    if (!branchId || !semester || !feedbackText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const query = `
      INSERT INTO student_feedback (feedback_id, branch_id, semester, feedback_text, rating, feedback_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await pool.query(query, [id, branchId, semester, feedbackText, rating, feedbackType]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    const query = `SELECT * FROM student_feedback WHERE feedback_id = $1;`;
    const result = await pool.query(query, [feedbackId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.organizeTimetable = function(timetable) {
  const organized = {};

  timetable.forEach(slot => {
    if (!organized[slot.day_of_week]) {
      organized[slot.day_of_week] = [];
    }

    organized[slot.day_of_week].push({
      time: `${slot.time_slot_start} - ${slot.time_slot_end}`,
      subject: slot.subject_name || slot.slot_type,
      type: slot.slot_type,
      professor: slot.professor_name,
      room: slot.room_id,
    });
  });

  return organized;
}
