const Timetable = require('../models/Timetable');
const TimetableAlgorithm = require('../algorithms/TimetableAlgorithm');
const pool = require('../config/db');

/**
 * Check for timetable conflicts
 * - Professor teaching at same time
 * - Lab capacity exceeded
 * - Time slot overlaps
 */
async function checkTimetableConflicts(timetable) {
  const conflicts = [];
  
  // Group by professor and time to check double booking
  const professorSchedule = {};
  const slotUsage = {};
  
  for (const slot of timetable) {
    if (!slot.professor_id || slot.slot_type === 'BREAK' || slot.slot_type === 'RECESS') continue;
    
    const profKey = slot.professor_id;
    const timeKey = `${slot.day_of_week}-${slot.time_slot_start}-${slot.time_slot_end}`;
    const slotKey = timeKey;
    
    // Check if professor is double booked
    if (!professorSchedule[profKey]) {
      professorSchedule[profKey] = [];
    }
    
    // Check if this professor already has something at this time
    const existingSlot = professorSchedule[profKey].find(s => 
      s.day === slot.day_of_week && 
      timeOverlaps(s.start, s.end, slot.time_slot_start, slot.time_slot_end)
    );
    
    if (existingSlot) {
      conflicts.push({
        type: 'PROFESSOR_DOUBLE_BOOKING',
        professor: slot.professor_name,
        subject1: existingSlot.subject,
        subject2: slot.subject_name,
        time: `${slot.day_of_week} ${slot.time_slot_start}-${slot.time_slot_end}`,
        severity: 'HIGH'
      });
    } else {
      professorSchedule[profKey].push({
        day: slot.day_of_week,
        start: slot.time_slot_start,
        end: slot.time_slot_end,
        subject: slot.subject_name
      });
    }
    
    // Check lab capacity (max 5 labs per slot)
    if (slot.slot_type === 'LAB') {
      if (!slotUsage[slotKey]) {
        slotUsage[slotKey] = 0;
      }
      slotUsage[slotKey]++;
      
      if (slotUsage[slotKey] > 5) {
        conflicts.push({
          type: 'LAB_CAPACITY_EXCEEDED',
          slot: slotKey,
          usage: slotUsage[slotKey],
          severity: 'MEDIUM'
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * Check if two time ranges overlap
 */
function timeOverlaps(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  return s1 < e2 && s2 < e1;
}

function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

exports.generateTimetable = async (req, res) => {
  try {
    const { branchId, semester } = req.body;

    if (!branchId || !semester) {
      return res.status(400).json({ error: 'Branch ID and semester are required' });
    }

    // Get branch name for better logging
    const branchResult = await pool.query('SELECT name FROM branches WHERE branch_id = $1', [branchId]);
    const branchName = branchResult.rows.length > 0 ? branchResult.rows[0].name : 'Unknown';

    console.log(`\n${'='.repeat(70)}`);
    console.log(`[Timetable] STARTING GENERATION`);
    console.log(`[Timetable] Branch: ${branchName} (ID: ${branchId})`);
    console.log(`[Timetable] Semester: ${semester}`);
    console.log(`[Timetable] Time: ${new Date().toLocaleString()}`);
    console.log(`${'='.repeat(70)}\n`);

    // Clear existing timetable
    const deletedCount = await Timetable.deleteByBranchSemester(branchId, semester);
    console.log(`[Timetable] Deleted ${deletedCount.length} existing timetable entries`);

    // Generate new timetable using algorithm
    const algorithm = new TimetableAlgorithm(branchId, semester);
    const result = await algorithm.generate();

    if (!result.success) {
      console.error(`[Timetable] ❌ Generation failed for ${branchName} (Sem ${semester}): ${result.error}`);
      return res.status(400).json({ 
        error: result.error, 
        conflicts: result.conflicts,
        details: result.details 
      });
    }

    console.log(`[Timetable] ✅ Successfully generated timetable with ${result.timetable.length} slots`);
    console.log(`[Timetable] Branch: ${branchName} | Semester: ${semester}\n`);
    
    // Fetch complete timetable with subject names from database
    const completeTimetable = await Timetable.findByBranchSemester(branchId, semester);
    
    // Check for conflicts
    const conflicts = await checkTimetableConflicts(completeTimetable);
    
    const detailed = completeTimetable.map(slot => ({
      timetable_id: slot.timetable_id,
      branch_id: branchId,
      branch_name: branchName,
      day_of_week: slot.day_of_week,
      time_slot_start: slot.time_slot_start,
      time_slot_end: slot.time_slot_end,
      slot_type: slot.slot_type,
      subject_id: slot.subject_id,
      subject_name: slot.subject_name || '-',
      professor_id: slot.professor_id,
      professor_name: slot.professor_name || '-',
      semester: slot.semester,
      batch_id: slot.batch_id,
      batch_number: slot.batch_number,
    }));
    
    res.json({ success: true, message: result.message, data: detailed, conflicts: conflicts });
  } catch (error) {
    console.error('[Timetable] Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error while generating timetable', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
};

exports.viewTimetable = async (req, res) => {
  try {
    const { branchId, semester } = req.params;

    const timetable = await Timetable.findByBranchSemester(branchId, semester);

    if (!timetable || timetable.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this branch-semester' });
    }

    // DEBUG: Log batch_id distribution
    const batchDist = {};
    timetable.forEach(slot => {
      if (slot.slot_type === 'LAB') {
        const bid = slot.batch_id || 'null';
        batchDist[bid] = (batchDist[bid] || 0) + 1;
      }
    });
    console.log(`[Debug] Batch distribution in DB: ${JSON.stringify(batchDist)}`);

    // Return flat array with all details for frontend table display
    const detailed = timetable.map(slot => {
      let labLabel = '-';
      if (slot.slot_type === 'LAB' && slot.batch_id) {
        // Determine batch letter (A or B) from batch_number
        labLabel = slot.batch_number === 1 ? 'Batch A' : 'Batch B';
      }
      return {
        timetable_id: slot.timetable_id,
        day_of_week: slot.day_of_week,
        time_slot_start: slot.time_slot_start,
        time_slot_end: slot.time_slot_end,
        slot_type: slot.slot_type,
        subject_id: slot.subject_id,
        subject_name: slot.subject_name || '-',
        professor_id: slot.professor_id,
        professor_name: slot.professor_name || '-',
        semester: slot.semester,
        batch_id: slot.batch_id,
        batch_number: slot.batch_number,
        lab_batch: labLabel
      };
    });

    res.json({ success: true, data: detailed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewProfessorTimetable = async (req, res) => {
  try {
    const { professorId } = req.params;

    const timetable = await Timetable.findByProfessor(professorId);

    if (!timetable || timetable.length === 0) {
      return res.status(404).json({ error: 'No timetable found for this professor' });
    }

    // Return flat array with all details for frontend table display
    const detailed = timetable.map(slot => {
      let labLabel = '-';
      if (slot.slot_type === 'LAB' && slot.batch_id) {
        labLabel = slot.batch_number === 1 ? 'Batch A' : 'Batch B';
      }
      return {
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
      };
    });

    res.json({ success: true, data: detailed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getConflicts = async (req, res) => {
  try {
    const { branchId, semester } = req.params;

    // Get all timetable entries
    const timetable = await Timetable.findByBranchSemester(branchId, semester);
    const conflicts = [];

    // Check for professor conflicts
    const professorMap = {};
    timetable.forEach(slot => {
      const key = `${slot.professor_id}-${slot.day_of_week}-${slot.time_slot_start}`;
      if (professorMap[key]) {
        conflicts.push({
          type: 'PROFESSOR_CONFLICT',
          professor: slot.professor_name,
          time: `${slot.day_of_week} ${slot.time_slot_start}`,
          details: 'Professor has two classes at same time'
        });
      } else {
        professorMap[key] = true;
      }
    });

    // Check for lab capacity conflicts
    const labMap = {};
    timetable.forEach(slot => {
      if (slot.slot_type === 'LAB') {
        const key = `${slot.day_of_week}-${slot.time_slot_start}`;
        labMap[key] = (labMap[key] || 0) + 1;

        if (labMap[key] > 5) {
          conflicts.push({
            type: 'LAB_CAPACITY_CONFLICT',
            time: `${slot.day_of_week} ${slot.time_slot_start}`,
            labs_scheduled: labMap[key],
            max_allowed: 5
          });
        }
      }
    });

    res.json({ success: true, conflicts_found: conflicts.length, data: conflicts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.validateTimetable = async (req, res) => {
  try {
    const { branchId, semester } = req.body;

    // Get all timetable entries
    const timetable = await Timetable.findByBranchSemester(branchId, semester);

    // Validation checks
    const validation = {
      total_slots: timetable.length,
      has_breaks: false,
      has_library_hours: false,
      professor_conflicts: 0,
      lab_capacity_violations: 0,
      is_valid: true
    };

    // Check for breaks
    validation.has_breaks = timetable.some(slot => slot.slot_type === 'BREAK' || slot.slot_type === 'RECESS');
    validation.has_library_hours = timetable.some(slot => slot.slot_type === 'LIBRARY');

    // Count lab conflicts
    const labMap = {};
    timetable.forEach(slot => {
      if (slot.slot_type === 'LAB') {
        const key = `${slot.day_of_week}-${slot.time_slot_start}`;
        labMap[key] = (labMap[key] || 0) + 1;
        if (labMap[key] > 5) {
          validation.lab_capacity_violations++;
        }
      }
    });

    validation.is_valid = validation.has_breaks && !validation.lab_capacity_violations;

    res.json({ success: true, data: validation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.clearTimetable = async (req, res) => {
  try {
    const { branchId, semester } = req.params;

    const deleted = await Timetable.deleteByBranchSemester(branchId, semester);
    res.json({ success: true, message: `${deleted.length} slots deleted`, deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.adjustSlot = async (req, res) => {
  try {
    const { timetableId } = req.params;
    const { timeStart, timeEnd, slotType } = req.body;

    const updated = await Timetable.update(timetableId, timeStart, timeEnd, slotType);

    if (!updated) {
      return res.status(404).json({ error: 'Timetable slot not found' });
    }

    res.json({ success: true, data: updated });
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
      id: slot.timetable_id,
      time: `${slot.time_slot_start} - ${slot.time_slot_end}`,
      subject: slot.subject_name || slot.slot_type,
      type: slot.slot_type,
      professor: slot.professor_name,
      branch: slot.branch_name,
      room: slot.room_id,
    });

    // Sort by time
    organized[slot.day_of_week].sort((a, b) => a.time.localeCompare(b.time));
  });

  return organized;
}
exports.checkConflicts = async (req, res) => {
  try {
    const { branchId, semester } = req.params;
    const semesterNum = parseInt(semester);

    console.log(`[Conflict Check] Starting for Branch: ${branchId}, Semester: ${semesterNum}`);

    const ConflictDetector = require('../services/ConflictDetector');
    const detector = new ConflictDetector(branchId, semesterNum);
    
    const result = await detector.detectAll();

    console.log(`[Conflict Check] Result:`, {
      success: result.success,
      conflicts: result.conflicts?.length || 0,
      warnings: result.warnings?.length || 0,
      gaps: result.gaps?.length || 0
    });

    res.json({
      success: result.success,
      message: result.message,
      summary: result.summary,
      conflictCount: result.conflictCount,
      warningCount: result.warningCount,
      gapCount: result.gapCount,
      conflicts: result.conflicts,
      warnings: result.warnings,
      gaps: result.gaps,
      hasIssues: result.conflictCount > 0
    });

  } catch (error) {
    console.error('[Conflict Check] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check conflicts',
      details: error.message
    });
  }
};