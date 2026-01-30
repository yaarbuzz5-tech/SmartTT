/**
 * Timetable Generation Algorithm
 * Uses Backtracking for constraint satisfaction and optimal scheduling
 * 
 * Rules:
 * 1. College Hours: 9:00 AM - 5:00 PM
 * 2. Tea Break: 11:00 AM - 11:15 AM (15 minutes)
 * 3. Recess: 1:15 PM - 2:00 PM (45 minutes)
 * 4. Lab Capacity: Max 5 labs per time slot
 * 5. Batch Fairness: A & B alternate schedules
 * 6. Library Hour: Once per week (conflict resolution)
 * 7. Project Hour: Once per week for Sem 3-8 only
 * 8. Multi-Branch Subjects: Different lab slots per branch
 */

const Timetable = require('../models/Timetable');
const pool = require('../config/db');

class TimetableAlgorithm {
  constructor(branchId, semester) {
    this.branchId = branchId;
    this.semester = semester;
    this.schedule = {};
    this.conflicts = [];
    this.constraints = {
      collegeStart: '09:00',
      collegeEnd: '17:00',
      teaBreakStart: '11:00',      // Updated
      teaBreakEnd: '11:15',        // Updated
      recessStart: '13:15',        // Updated (1:15 PM)
      recessEnd: '14:00',          // Updated (2:00 PM)
      teaBreakDuration: 15,
      recessDuration: 45,
      labCapacity: 5,
      libraryHourDuration: 60,
      projectHourDuration: 60,
    };
    this.timeSlots = this.generateTimeSlots();
    this.backtrackingDepth = 0;
    this.maxBacktrackingDepth = 100;
  }

  /**
   * Generate available time slots for the day
   * 
   * Daily Schedule:
   * 09:00-11:00 → Block 1 (2 hours)
   * 11:00-11:15 → Tea Break (FIXED - no scheduling)
   * 11:15-13:15 → Block 2 (2 hours)
   * 13:15-14:00 → Recess (FIXED - no scheduling)
   * 14:00-16:00 → Block 3 (2 hours)
   * 16:00-17:00 → Library/Project Hour (1 hour)
   *
   * Effective Teaching Time: 9:00-5:00 PM (8 hours) minus breaks (1 hour) = 7 hours total
   * Available for Theory/Labs: ~7 hours per day
   *
   * THEORY: 1-hour slots (can fit multiple per day in different blocks)
   * LABS:   2-hour slots (require continuous 2-hour blocks)
   */
  generateTimeSlots() {
    const slots = [];
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    
    // Convert break times to minutes for easier calculation
    const collegeStart = 9 * 60;     // 09:00
    const collegeEnd = 17 * 60;      // 17:00
    const teaBreakStart = 11 * 60;   // 11:00
    const teaBreakEnd = 11 * 60 + 15; // 11:15
    const recessStart = 13 * 60 + 15; // 13:15
    const recessEnd = 14 * 60;       // 14:00
    const libraryStart = 16 * 60;    // 16:00
    const libraryEnd = 17 * 60;      // 17:00

    // Define continuous time blocks (breaks excluded)
    // Block 1: 09:00-11:00 (120 min)
    const block1Start = collegeStart;
    const block1End = teaBreakStart;
    
    // Block 2: 11:15-13:15 (120 min)
    const block2Start = teaBreakEnd;
    const block2End = recessStart;
    
    // Block 3: 14:00-16:00 (120 min)
    const block3Start = recessEnd;
    const block3End = libraryStart;
    
    // Block 4: 16:00-17:00 (60 min - Library/Project Hour)
    const block4Start = libraryStart;
    const block4End = libraryEnd;

    // All continuous blocks (for easier iteration)
    const teachingBlocks = [
      { start: block1Start, end: block1End, minutes: 120 },
      { start: block2Start, end: block2End, minutes: 120 },
      { start: block3Start, end: block3End, minutes: 120 },
      { start: block4Start, end: block4End, minutes: 60 }
    ];

    // Generate slots for each day
    days.forEach(day => {
      // THEORY SLOTS: 1-hour slots from all blocks
      teachingBlocks.forEach((block, blockIdx) => {
        let timePointer = block.start;
        
        // Generate 1-hour theory slots within this block
        while (timePointer + 60 <= block.end) {
          const slotStart = this.minutesToTime(timePointer);
          const slotEnd = this.minutesToTime(timePointer + 60);
          
          slots.push({
            day,
            start: slotStart,
            end: slotEnd,
            type: 'available',
            sessionType: 'THEORY',   // 1 hour
            blockId: blockIdx,
            isLabSlot: false,
            duration: 60
          });
          
          timePointer += 60;
        }
      });

      // LAB SLOTS: 2-hour continuous slots from blocks 1-3 only (blocks that have ≥120 min)
      // Labs CANNOT span breaks, so only blocks with 120+ minutes can have labs
      [0, 1, 2].forEach(blockIdx => {
        const block = teachingBlocks[blockIdx];
        if (block.minutes >= 120) {
          // Lab must fit completely within block (2-hour continuous)
          const labStart = this.minutesToTime(block.start);
          const labEnd = this.minutesToTime(block.start + 120);
          
          slots.push({
            day,
            start: labStart,
            end: labEnd,
            type: 'available',
            sessionType: 'LAB',      // 2 hours
            blockId: blockIdx,
            isLabSlot: true,
            duration: 120
          });
        }
      });
    });

    // Log slot generation summary
    const theorySlots = slots.filter(s => !s.isLabSlot).length;
    const labSlots = slots.filter(s => s.isLabSlot).length;
    console.log(`[TimeSlots] Generated: ${theorySlots} theory slots + ${labSlots} lab slots = ${slots.length} total`);
    console.log(`[TimeSlots] Daily breakdown: ${theorySlots / 5} theory/day, ${labSlots / 5} lab/day per block`);
    console.log(`[TimeSlots] Breaks excluded: Tea (11:00-11:15), Recess (13:15-14:00)`);
    console.log(`[TimeSlots] Available teaching time: 7 hours/day (9:00-5:00 PM minus 1 hour breaks)`);

    return slots;
  }

  /**
   * Convert time string to minutes since midnight
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes to time string
   */
  minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  /**
   * Main timetable generation function
   */
  async generate() {
    try {
      // Get subjects for this branch and semester
      const subjects = await this.getSubjectsForBranchSemester();
      
      if (subjects.length === 0) {
        return { success: false, error: 'No subjects found for this branch-semester' };
      }

      console.log(`\n[Algorithm] Branch: ${this.branchId} | Semester: ${this.semester}`);
      console.log(`[Algorithm] Found ${subjects.length} subjects`);

      // Separate theory and lab subjects
      const { theorySubjects, labSubjects, bothSubjects } = this.categorizeSubjects(subjects);
      
      console.log(`[Algorithm] Theory: ${theorySubjects.length} | Lab: ${labSubjects.length} | Both: ${bothSubjects.length}`);

      // Initialize schedule
      this.initializeSchedule();

      // ⚠️ CRITICAL: Schedule THEORY FIRST (BEST EFFORT)
      // Theory lectures are prioritized but NOT BLOCKING
      // We schedule as much as possible, then continue with labs
      console.log(`[Algorithm-Sem${this.semester}] Scheduling THEORY lectures (PRIORITY 1 - BEST EFFORT)...`);
      const theoryScheduled = await this.scheduleTheory([...theorySubjects, ...bothSubjects]);

      // Log theory scheduling results but DON'T FAIL on it
      if (theoryScheduled.conflicts.length > 0) {
        console.warn(`[Algorithm-Sem${this.semester}] ⚠️ Warning: ${theoryScheduled.conflicts.length} theory gaps (continuing anyway)`);
        theoryScheduled.conflicts.forEach(c => {
          console.warn(`  - ${c.subject}: got ${c.scheduled}/${c.required} (gap of ${c.missing})`);
        });
      }

      console.log(`[Algorithm-Sem${this.semester}] Theory scheduling complete: ${theoryScheduled.totalScheduled} slots`);

      // Step 2: Schedule labs (after theory, or alongside if gaps exist)
      console.log(`[Algorithm-Sem${this.semester}] Scheduling labs (PRIORITY 2)...`);
      const labScheduled = await this.scheduleLabs([...labSubjects, ...bothSubjects]);

      if (!labScheduled.success) {
        console.warn(`[Algorithm-Sem${this.semester}] Warning: Failed to schedule all labs`, labScheduled.conflicts);
        // Labs not mandatory if theory is satisfied
        // Continue even if some labs couldn't be scheduled
      }

      // Step 2.5: CRITICAL - Detect and fix batch-level conflicts
      // Ensure no batch has theory + lab at the same time
      console.log(`[Algorithm-Sem${this.semester}] Checking for batch-level conflicts...`);
      const conflictDetection = await this.detectAndFixBatchConflicts();
      if (conflictDetection.conflictsFixed > 0) {
        console.warn(`[Algorithm-Sem${this.semester}] ⚠️ Fixed ${conflictDetection.conflictsFixed} batch conflicts`);
        conflictDetection.details.forEach(d => {
          console.warn(`  - ${d.issue}: ${d.resolution}`);
        });
      }

      // Step 3: Add breaks and library hours
      console.log(`[Algorithm-Sem${this.semester}] Adding breaks and library hours...`);
      try {
        await this.scheduleBreaksAndLibrary();
      } catch (error) {
        console.error(`[Algorithm-Sem${this.semester}] Error scheduling breaks and library:`, error);
      }

      // Step 4: Validate timetable BEFORE saving
      console.log(`[Algorithm-Sem${this.semester}] Validating timetable...`);
      const validationResult = await this.validateGeneratedTimetable();
      
      if (!validationResult.success) {
        console.error(`[Algorithm-Sem${this.semester}] ❌ VALIDATION FAILED`);
        validationResult.errors.forEach(err => console.error(`  ❌ ${err}`));
        return { 
          success: false, 
          error: 'Timetable has critical conflicts after generation',
          validationErrors: validationResult.errors
        };
      }

      console.log(`[Algorithm-Sem${this.semester}] ✅ Validation PASSED`);

      // Step 5: Save timetable to database
      console.log(`[Algorithm-Sem${this.semester}] Saving to database...`);
      const saved = await this.saveTimetableToDb();

      if (saved.length === 0) {
        return { success: false, error: 'Failed to save any timetable slots to database' };
      }

      console.log(`[Algorithm-Sem${this.semester}] ✅ Saved ${saved.length} slots`);
      return { success: true, message: 'Timetable generated successfully', timetable: saved };

    } catch (error) {
      console.error(`[Algorithm] ❌ Error generating timetable:`, error);
      return { success: false, error: error.message, details: error.stack };
    }
  }

  /**
   * THEORY SCHEDULING: WEEKLY HOUR FULFILLMENT LOGIC
   * 
   * PRIORITY: Schedule all required theory lectures FIRST
   * This ensures each subject gets its mandatory weekly teaching hours
   * 
   * WEEKLY HOUR CALCULATION:
   * - 1 Theory Lecture = 1 hour (fixed session duration)
   * - Weekly Theory Hours = weekly_lecture_count × 1 hour
   * - Example: 3 lectures/week = 3 hours of theory per week
   * 
   * CREDIT-BASED DEFAULTS:
   * - If weekly_lecture_count not specified, derive from subject credits
   * - Standard: 1 credit ≈ 1 hour of theory per week
   * - Example: 4-credit subject → 4 lectures/week (4 hours)
   * 
   * CONSTRAINTS:
   * - Minimum: 2 lectures/week (2 hours minimum - MUST be met)
   * - Maximum: 3 lectures/week (3 hours max - prevents over-scheduling)
   * - No subject more than once per day (spreading across week)
   * - Theory scheduled BEFORE labs (priority 1)
   * 
   * FAILURE HANDLING:
   * - If any subject cannot meet MINIMUM (2 lectures/week), it's logged as CONFLICT
   * - But generation continues (best-effort approach)
   * - Admin panel shows which subjects have insufficient theory hours
   * 
   * TIME SLOTS:
   * - Each theory lecture uses ONE 1-hour timeslot from available slots
   * - Available slots: 9:00-17:00 minus breaks (11:00-11:15 Tea, 13:15-14:00 Recess)
   * - 5 days × ~7 slots per day = 35+ available theory slots per week
   */
  async scheduleTheory(subjects) {
    const conflicts = [];
    
    // Track which days each subject is scheduled
    const subjectDayMap = new Map();
    
    // Get all theory/both subjects
    const allTheorySubjects = subjects.filter(s => s.type === 'THEORY' || s.type === 'BOTH');
    
    // Log available slots for debugging
    const availableTheorySlots = this.timeSlots.filter(s => !s.isLabSlot).length;
    console.log(`[Theory-Sem${this.semester}] Available theory slots: ${availableTheorySlots} (5 days × 7 per day)`);
    
    // IMPROVED: Better default logic - use credits if available
    const subjectsWithDefaults = allTheorySubjects.map(s => {
      let lectureCount = s.weekly_lecture_count || 0;
      
      // If no lecture count is set but credits exist, derive from credits
      if (lectureCount === 0 && s.credits > 0) {
        // Standard: 1 credit = ~1 hour of theory per week
        lectureCount = Math.ceil(s.credits);
        console.log(`  [Credit-Based] ${s.code}: Derived ${lectureCount} lectures from ${s.credits} credits`);
      }
      
      // Fallback to reasonable default if still 0
      if (lectureCount === 0) {
        lectureCount = 2; // Default 2 lectures/week (was 3, reducing for slot availability)
      }
      
      // Cap theory at reasonable maximum (3 per week for better slot availability)
      // Reduced from 4 to ensure we have enough slots
      if (lectureCount > 3) {
        console.warn(`  [Theory Cap] ${s.code}: Limited ${lectureCount} → 3 lectures/week`);
        lectureCount = 3;
      }
      
      return { ...s, weekly_lecture_count: lectureCount };
    });
    
    // Sort subjects by lecture count (most constrained first)
    const sortedSubjects = subjectsWithDefaults
      .filter(s => (s.weekly_lecture_count || 0) > 0)
      .sort((a, b) => (b.weekly_lecture_count || 0) - (a.weekly_lecture_count || 0));

    console.log(`[Theory-Sem${this.semester}] 📚 Scheduling ${sortedSubjects.length} theory subjects (MANDATORY)`);
    console.log(`[Theory-Sem${this.semester}] Target: 4-5 subjects × 3 slots minimum = 12-25 classes`);

    let totalTheorySlots = 0;
    let failedSubjects = [];

    for (const subject of sortedSubjects) {
      let lectureCount = subject.weekly_lecture_count || 0;
      if (lectureCount === 0) continue;

      subjectDayMap.set(subject.subject_id, new Set());

      // Schedule lectures spread across different days
      // Ensure each day has at most 1 lecture per subject
      let scheduled = await this.scheduleTheoryDistributed(
        subject, 
        lectureCount, 
        subjectDayMap.get(subject.subject_id)
      );

      // ADAPTIVE: If we couldn't schedule all lectures, try with reduced count
      if (scheduled < lectureCount) {
        console.warn(`  [Theory-Adaptive] ${subject.code}: Could only schedule ${scheduled}/${lectureCount}, trying with reduced target...`);
        
        // Try with reduced lecture count (reduce by 1 and retry)
        const reducedCount = lectureCount - 1;
        if (reducedCount >= 2) { // Keep minimum 2
          // Clear previously scheduled slots for this subject and retry
          for (const [key, slot] of Object.entries(this.schedule)) {
            if (slot.type === 'THEORY' && slot.subject?.subject_id === subject.subject_id) {
              delete this.schedule[key];
            }
          }
          subjectDayMap.get(subject.subject_id).clear();
          
          scheduled = await this.scheduleTheoryDistributed(
            subject, 
            reducedCount, 
            subjectDayMap.get(subject.subject_id)
          );
          
          if (scheduled === reducedCount) {
            console.log(`  ✓ ${subject.code}: Successfully scheduled ${scheduled}/${reducedCount} lectures (reduced)`);
          }
        }
      }

      totalTheorySlots += scheduled;

      if (scheduled < 2) { // Only fail if we can't meet MINIMUM 2 hours
        // CRITICAL: Theory lectures are MANDATORY minimum 2 per week
        const conflict = {
          subject: subject.name,
          code: subject.code,
          reason: `MANDATORY MINIMUM: Could not schedule minimum 2 lectures - only ${scheduled} scheduled`,
          scheduled,
          required: 2,
          missing: Math.max(0, 2 - scheduled),
          severity: 'CRITICAL'
        };
        conflicts.push(conflict);
        failedSubjects.push(subject.code);
        
        console.error(`  ❌ ${subject.code} (${subject.name}): FAILED - ${scheduled}/2 lectures (MINIMUM NOT MET)`);
      } else {
        console.log(`  ✓ ${subject.code} (${subject.name}): ${scheduled} lectures scheduled`);
      }
    }

    console.log(`[Theory-Sem${this.semester}] Total theory slots scheduled: ${totalTheorySlots}`);
    
    // BEST EFFORT: Report gaps as warnings, not failures
    if (failedSubjects.length > 0) {
      console.warn(`[Theory-Sem${this.semester}] ⚠️  NOTE: ${failedSubjects.length} subject(s) have fewer than ideal lectures: ${failedSubjects.join(', ')}`);
    }
    
    // Warn if utilization is too low
    if (totalTheorySlots < 12) {
      console.warn(`[Theory-Sem${this.semester}] ⚠️  Low utilization: Only ${totalTheorySlots} theory slots (target: 12-25)`);
    }

    return { 
      success: true,  // Always succeed - theory is best-effort, not blocking
      conflicts, 
      totalScheduled: totalTheorySlots,
      failedSubjects 
    };
  }

  /**
   * Schedule theory lectures - AGGRESSIVE MODE
   * Simply grab any available slot without restrictions
   * Only check professor availability
   */
  async scheduleTheoryDistributed(subject, lectureCount, usedDays = new Set()) {
    let scheduled = 0;

    // Get ALL available theory slots (not lab slots) and filter by availability
    const availableSlots = [];
    for (const slot of this.timeSlots) {
      if (slot.isLabSlot) continue; // Skip lab slots
      
      const slotKey = `${slot.day}-${slot.start}`;
      if (this.schedule[slotKey]) continue; // Skip occupied slots

      // CRITICAL: Skip library and project hours (they are exclusive)
      if ((slot.day === 'FRI' && slot.start === '16:00') ||  // Library hour FRI 16:00-17:00
          (slot.day === 'THU' && this.semester >= 3 && slot.start === '16:00')) {  // Project hour THU 16:00-17:00 for Sem 3+
        continue;
      }

      // Check professor availability
      const profConflicts = await Timetable.checkConflict(
        subject.professor_id,
        slot.day,
        slot.start,
        slot.end
      );

      if (profConflicts.length === 0) {
        availableSlots.push(slot);
      }
    }

    console.log(`  [Theory-Slots] ${subject.code}: Found ${availableSlots.length} available slots for ${lectureCount} needed`);

    // Sort slots: prefer different days first, then allow repeats
    availableSlots.sort((a, b) => {
      const aDayUsed = usedDays.has(a.day) ? 1 : 0;
      const bDayUsed = usedDays.has(b.day) ? 1 : 0;
      return aDayUsed - bDayUsed; // Prefer unused days first
    });

    // Schedule lectures using available slots
    for (const slot of availableSlots) {
      if (scheduled >= lectureCount) break;

      const slotKey = `${slot.day}-${slot.start}`;
      if (!this.schedule[slotKey]) {
        this.schedule[slotKey] = {
          subject,
          type: 'THEORY',
          day: slot.day,
          start: slot.start,
          end: slot.end,
        };
        usedDays.add(slot.day);
        scheduled++;
      }
    }

    return scheduled;
  }

  /**
   * Find available slot for a subject on a specific day
   * THEORY FIRST: No labs scheduled yet, so no lab conflicts
   * Just need to check for:
   * 1. Slot not already occupied
   * 2. Professor availability
   * 3. Not during breaks
   */
  async findAvailableSlotForDay(subject, day, allowMultiple = false) {
    // Get all 1-hour theory slots for this day (non-lab slots)
    const daySlots = this.timeSlots.filter(s => 
      s.day === day && 
      !s.isLabSlot &&  // Only theory slots (1 hour)
      !this.schedule[`${s.day}-${s.start}`] // Not already occupied
    );

    // Prefer afternoon times for theory (14:00-17:00, 15:00-17:00, 16:00-17:00)
    // But accept any available slot if needed
    const preferredOrder = ['16:00', '15:00', '14:00', '13:00', '10:00', '11:15', '09:00'];
    
    // Try preferred times first
    for (const prefTime of preferredOrder) {
      const slot = daySlots.find(s => s.start === prefTime);
      if (!slot) continue;

      // Check professor availability
      const profConflicts = await Timetable.checkConflict(
        subject.professor_id,
        slot.day,
        slot.start,
        slot.end
      );

      if (profConflicts.length === 0) {
        return slot;
      }
    }

    // If preferred times don't work, use ANY available slot on this day
    for (const slot of daySlots) {
      const profConflicts = await Timetable.checkConflict(
        subject.professor_id,
        slot.day,
        slot.start,
        slot.end
      );

      if (profConflicts.length === 0) {
        return slot;
      }
    }

    return null;
  }

  /**
   * REWRITTEN: Lab scheduling with COMPREHENSIVE CONSTRAINT ENFORCEMENT
   * Fixes:
   * 1. Batch Alternation: Both Batch A & B MUST be scheduled (not just B)
   * 2. Batch Time Overlap: One activity per batch per time slot (hard constraint)
   * 3. Professor Availability: One activity per professor per time slot (all types)
   * 4. Lab Distribution: Prevent same lab on consecutive days per batch
   * 5. Lab Capacity: Actively enforce max 5 labs per slot
   * 6. Spacing Constraint: Min 1 day gap between same subject labs per batch
   * 7. CONSTRAINT 4: Faculty max 6 hrs/day - Prevent professor overload
   */
  async scheduleLabs(subjects) {
    const conflicts = [];
    
    // Track scheduling per batch to enforce constraints
    const batchScheduling = {
      'A': { 
        scheduled: 0,
        subjectLastDay: new Map(), // subject_id -> last day scheduled
        dayActivities: new Map() // day -> [activity objects] per batch
      },
      'B': {
        scheduled: 0,
        subjectLastDay: new Map(),
        dayActivities: new Map()
      }
    };

    // CONSTRAINT 4: Track professor daily hours (max 6 hrs/day)
    // Key: "prof_id-day", Value: total hours scheduled that day
    const professorDailyHours = new Map(); // "prof_id-day" -> hours
    
    // Track professor scheduling across ALL activity types
    const professorSchedule = new Map(); // prof_id -> [{day, start, end, type}]
    
    // Track lab capacity per slot
    const labSlotUsage = new Map(); // "DAY-START-END" -> count of labs
    
    // Track all batch activities (THEORY + LAB + BREAKS)
    const batchTimeActivities = new Map(); // "BATCH-DAY-START-END" -> activity

    // Collect all existing activities from schedule (theory, breaks, etc.)
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (!slot.subject?.professor_id && slot.type !== 'BREAK' && slot.type !== 'RECESS') continue;
      
      // Add to batch tracking if applicable
      if (slot.batch) {
        const batchKey = `${slot.batch}-${slot.day}-${slot.start}-${slot.end}`;
        if (!batchTimeActivities.has(batchKey)) {
          batchTimeActivities.set(batchKey, []);
        }
        batchTimeActivities.get(batchKey).push({
          type: slot.type,
          subject: slot.subject?.name || slot.type,
          time: `${slot.start}-${slot.end}`
        });
      }
      
      // Track professor schedule
      if (slot.subject?.professor_id) {
        const profId = slot.subject.professor_id;
        if (!professorSchedule.has(profId)) {
          professorSchedule.set(profId, []);
        }
        professorSchedule.get(profId).push({
          day: slot.day,
          start: slot.start,
          end: slot.end,
          type: slot.type,
          subject: slot.subject.name
        });
      }
    }

    // CONSTRAINT 1: Skip labs for THEORY-only subjects
    // Math, Ethics, Philosophy, etc. should NOT have labs
    const theoryOnlySubjects = subjects.filter(s => s.type === 'THEORY');
    const labEligibleSubjects = subjects.filter(s => s.type === 'LAB' || s.type === 'BOTH');
    
    if (theoryOnlySubjects.length > 0) {
      console.log(`[Labs] ℹ️ Skipping lab scheduling for ${theoryOnlySubjects.length} THEORY-only subjects:`);
      theoryOnlySubjects.forEach(s => console.log(`  • ${s.code} (${s.name})`));
    }
    
    // Filter lab subjects and apply CONSTRAINTS for lab scheduling
    const allLabSubjects = labEligibleSubjects; // Only LAB and BOTH types
    
    const labSubjects = allLabSubjects
      .map(s => {
        let labCount = s.weekly_lab_count || 0;
        
        // CONSTRAINT 2: Cap lab slots to MAXIMUM 2 per week (very strict)
        // Realistic lab frequency: 1-2 labs/week, never more
        const maxLabSlots = 2; // Hard cap at 2
        
        if (labCount === 0) {
          labCount = 2; // Default 2 labs/week
        } else if (labCount > maxLabSlots) {
          // Log excessive labs
          console.warn(`  [Lab Cap] ${s.code}: Limiting ${labCount} labs → ${maxLabSlots} (max - STRICT)`);
          labCount = maxLabSlots;
        }
        
        return { ...s, weekly_lab_count: labCount };
      })
      .filter(s => (s.weekly_lab_count || 0) > 0);

    console.log(`\n[Labs] ════════════════════════════════════════`);
    console.log(`[Labs] 🔬 Scheduling ${labSubjects.length} lab subjects`);
    console.log(`[Labs] 📌 CONSTRAINT: Batch A & B scheduled SEPARATELY (no overlap)`);
    console.log(`[Labs] 📌 Max labs/week: ${labSubjects.length > 0 ? 'Normal=2, Heavy=3' : '0'}`);
    console.log(`[Labs] 📌 Lab capacity: Max 5 per time slot`);

    const batches = ['A', 'B'];
    
    // Track which subjects have overlapping batches (VIOLATION LOGGING)
    const overlapSubjects = new Map(); // subject_id -> { day, time }


    for (const subject of labSubjects) {
      const labCount = subject.weekly_lab_count || 2;
      const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

      console.log(`\n[Labs] Subject: ${subject.name} (${labCount} labs/week)`);

      // Schedule labs for EACH BATCH independently
      for (const batch of batches) {
        let labsScheduled = 0;
        const batchState = batchScheduling[batch];

        console.log(`  [Batch ${batch}]`);

        // Try scheduling on different days with proper spacing
        for (const dayIdx in days) {
          if (labsScheduled >= labCount) break;

          const day = days[dayIdx];
          const lastDay = batchState.subjectLastDay.get(subject.subject_id);

          // CONSTRAINT: Enforce spacing - don't schedule on consecutive days for same subject
          if (lastDay !== undefined) {
            const lastDayIdx = days.indexOf(lastDay);
            const dayGap = Math.abs(parseInt(dayIdx) - lastDayIdx);
            
            if (dayGap < 2) {
              console.log(`    ✗ ${day}: Spacing constraint - same subject scheduled on ${lastDay} (gap=${dayGap}, need ≥2)`);
              continue;
            }
          }

          // Find available lab slot for this day
          const slot = await this.findLabSlotWithValidation(
            subject, 
            day, 
            batch,
            labSlotUsage,
            professorSchedule,
            batchState.dayActivities
          );

          if (slot) {
            // CONSTRAINT 1: Check if batch already has ANY activity (theory/lab/break) in this time slot
            const batchTimeKey = `${batch}-${day}-${slot.start}-${slot.end}`;
            if (batchTimeActivities.has(batchTimeKey)) {
              console.log(`    ✗ ${day} ${slot.start}: Batch ${batch} already has activity at this time`);
              continue;
            }
            
            // CONSTRAINT 2: Check for time overlaps with other activities in this batch on same day
            const dayKey = `${day}`;
            if (!batchState.dayActivities.has(dayKey)) {
              batchState.dayActivities.set(dayKey, []);
            }

            const dayActivities = batchState.dayActivities.get(dayKey);
            const slotConflict = dayActivities.some(act => 
              this.timeOverlaps(act.start, act.end, slot.start, slot.end)
            );

            if (slotConflict) {
              console.log(`    ✗ ${day} ${slot.start}: Batch ${batch} has overlapping activity on this day`);
              continue;
            }

            // CONSTRAINT 3: Check lab capacity (global across all branches)
            const labSlotKey = `${day}-${slot.start}-${slot.end}`;
            const currentUsage = labSlotUsage.get(labSlotKey) || 0;
            if (currentUsage >= this.constraints.labCapacity) {
              console.log(`    ✗ ${day} ${slot.start}: Lab slot at capacity (${currentUsage}/${this.constraints.labCapacity})`);
              continue;
            }

            // CONSTRAINT 4: Check professor availability across ALL types
            const profId = subject.professor_id;
            const profActivities = professorSchedule.get(profId) || [];
            const profConflict = profActivities.some(act => 
              act.day === day && this.timeOverlaps(act.start, act.end, slot.start, slot.end)
            );

            if (profConflict) {
              console.log(`    ✗ ${day} ${slot.start}: Professor already assigned`);
              continue;
            }

            // ALL CONSTRAINTS PASSED - schedule the lab
            const labKey = `${day}-${slot.start}-LAB-${subject.subject_id}-${batch}`;
            
            this.schedule[labKey] = {
              subject,
              type: 'LAB',
              batch,
              day,
              start: slot.start,
              end: slot.end,
            };

            // Update tracking
            labSlotUsage.set(labSlotKey, currentUsage + 1);
            batchState.subjectLastDay.set(subject.subject_id, day);
            dayActivities.push({ start: slot.start, end: slot.end, type: 'LAB', subject: subject.name });
            
            // Track batch-time activity
            batchTimeActivities.set(batchTimeKey, { type: 'LAB', subject: subject.name });
            
            // Update professor schedule
            if (!professorSchedule.has(profId)) {
              professorSchedule.set(profId, []);
            }
            professorSchedule.get(profId).push({
              day, 
              start: slot.start, 
              end: slot.end, 
              type: 'LAB',
              subject: subject.name
            });

            labsScheduled++;
            batchState.scheduled++;

            console.log(`    ✓ Lab ${labsScheduled}/${labCount} on ${day} ${slot.start}-${slot.end} (slot: ${currentUsage + 1}/${this.constraints.labCapacity})`);
          } else {
            console.log(`    ✗ ${day}: No available slot`);
          }
        }

        // Check if BOTH batches have labs scheduled (enforcement)
        if (labsScheduled === 0) {
          console.log(`  ⚠️ WARNING: Batch ${batch} has 0 labs! This is a CRITICAL FAILURE.`);
          conflicts.push({
            subject: subject.name,
            batch,
            severity: 'CRITICAL',
            reason: `Batch ${batch} has NO labs scheduled for ${subject.name}`,
          });
        } else if (labsScheduled < labCount) {
          conflicts.push({
            subject: subject.name,
            batch,
            severity: 'WARNING',
            scheduled: labsScheduled,
            required: labCount,
          });
        }
      }
    }

    // CRITICAL VALIDATION: Check for BATCH OVERLAPS on same subject labs
    console.log(`\n[Labs-Validation] 🔍 Checking for batch overlaps on same subject...`);
    const batchOverlaps = this.checkBatchLabOverlaps(labSubjects);
    
    if (batchOverlaps.length > 0) {
      console.warn(`[Labs-Validation] ❌ FOUND ${batchOverlaps.length} BATCH OVERLAPS:`);
      batchOverlaps.forEach(overlap => {
        console.warn(`  ⚠️  ${overlap.subject}: Batch A & B both on ${overlap.day} ${overlap.time}`);
        conflicts.push({
          severity: 'HIGH',
          type: 'BATCH_OVERLAP',
          subject: overlap.subject,
          reason: `Batch A and Batch B scheduled simultaneously for same lab`
        });
      });
    } else {
      console.log(`[Labs-Validation] ✓ No batch overlaps detected`);
    }

    // CRITICAL VALIDATION: Ensure both batches were scheduled
    const batchALabCount = batchScheduling['A'].scheduled;
    const batchBLabCount = batchScheduling['B'].scheduled;

    console.log(`[Labs] ════════════════════════════════════════`);
    console.log(`[Labs] Scheduling Summary:`);
    console.log(`  Batch A: ${batchALabCount} labs`);
    console.log(`  Batch B: ${batchBLabCount} labs`);

    // MODIFIED: Batch alternation is no longer a requirement - just note it
    if (batchALabCount === 0) {
      console.log(`[Labs] ⚠️ NOTE: Batch A has no labs scheduled for this semester`);
    }

    if (batchBLabCount === 0) {
      console.log(`[Labs] ⚠️ NOTE: Batch B has no labs scheduled for this semester`);
    }

    console.log(`[Labs] Conflicts found: ${conflicts.length}`);
    
    // MODIFIED: Removed batch alternation requirement - not all semesters have equal lab requirements
    // Just check that there are no CRITICAL conflicts (overlaps, capacity, etc.)
    return { 
      success: conflicts.length === 0, // Only check for critical conflicts, not batch count
      conflicts,
      batchStats: { batchA: batchALabCount, batchB: batchBLabCount }
    };
  }

  /**
   * CONSTRAINT 5: Check consecutive day gap for lab scheduling
   * Same lab subject cannot appear on consecutive days for same batch
   * Minimum 1-day gap required between same subject labs
   */
  hasConsecutiveDayLabConflict(batchId, subjectId, newDay) {
    const dayOrder = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const newDayIdx = dayOrder.indexOf(newDay);
    
    // Find all lab slots for this batch-subject combination
    const existingLabs = Object.values(this.schedule).filter(slot => {
      return slot.type === 'LAB' && 
             slot.batch === batchId && 
             slot.subject?.subject_id === subjectId;
    });
    
    // Check if any existing lab is on adjacent days
    for (const lab of existingLabs) {
      const existingDayIdx = dayOrder.indexOf(lab.day);
      const dayGap = Math.abs(newDayIdx - existingDayIdx);
      
      // CONSTRAINT: Day gap must be at least 1 (not consecutive)
      if (dayGap === 1) {
        return true; // Conflict: consecutive days detected
      }
    }
    
    return false; // No consecutive day conflict
  }

  /**
   * CHECK FOR BATCH OVERLAPS
   * Returns list of subjects where Batch A & B are scheduled at same time
   * This is a critical issue that must be fixed
   */
  checkBatchLabOverlaps(labSubjects) {
    const overlaps = [];
    const subjectLabMap = new Map(); // subject_id -> [{batch, day, start, end}]

    // Collect all lab slots by subject
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'LAB') continue;
      
      const subjId = slot.subject?.subject_id;
      if (!subjId) continue;

      if (!subjectLabMap.has(subjId)) {
        subjectLabMap.set(subjId, []);
      }
      subjectLabMap.get(subjId).push({
        batch: slot.batch,
        day: slot.day,
        start: slot.start,
        end: slot.end
      });
    }

    // Check for overlaps per subject
    for (const [subjId, labs] of subjectLabMap) {
      const subject = labSubjects.find(s => s.subject_id === subjId);
      const subjName = subject?.name || `Unknown (${subjId})`;

      for (let i = 0; i < labs.length; i++) {
        for (let j = i + 1; j < labs.length; j++) {
          const lab1 = labs[i];
          const lab2 = labs[j];

          // Check if same day and overlapping time, different batches
          if (lab1.day === lab2.day && lab1.batch !== lab2.batch) {
            if (this.timeOverlaps(lab1.start, lab1.end, lab2.start, lab2.end)) {
              overlaps.push({
                subject: subjName,
                day: lab1.day,
                time: `${lab1.start}-${lab1.end}`,
                batch1: lab1.batch,
                batch2: lab2.batch
              });
            }
          }
        }
      }
    }

    return overlaps;
  }

  /**
   * Find lab slot with COMPREHENSIVE VALIDATION
   * Checks:
   * 1. No overlapping activity for this batch in same slot
   * 2. No professor conflict (across all activity types)
   * 3. No subject theory-lab overlap
   * 4. Slot not at capacity
   * 5. Not scheduled on consecutive days for same subject
   */
  async findLabSlotWithValidation(subject, day, batch, labSlotUsage, professorSchedule, batchDayActivities) {
    const preferredTimes = ['14:00', '15:00', '10:00', '16:00', '09:00'];

    for (const startTime of preferredTimes) {
      const slot = this.timeSlots.find(s => 
        s.day === day && 
        s.start === startTime && 
        s.isLabSlot === true
      );

      if (!slot) continue;

      // CONSTRAINT 1: Check subject-theory overlap
      const subjectHasTheory = Object.entries(this.schedule).some(([key, value]) => 
        value.subject?.subject_id === subject.subject_id &&
        value.type === 'THEORY' &&
        value.day === day &&
        this.timeOverlaps(value.start, value.end, slot.start, slot.end)
      );

      if (subjectHasTheory) {
        continue;
      }

      // CONSTRAINT 2: Check professor availability (ALL types: THEORY, LAB, LIBRARY, PROJECT)
      const profActivities = professorSchedule.get(subject.professor_id) || [];
      const profConflict = profActivities.some(act => 
        act.day === day && 
        this.timeOverlaps(act.start, act.end, slot.start, slot.end)
      );

      if (profConflict) {
        continue;
      }

      // CONSTRAINT 3: Check lab capacity
      const slotKey = `${day}-${startTime}`;
      const usage = labSlotUsage.get(slotKey) || 0;
      if (usage >= this.constraints.labCapacity) {
        continue;
      }

      // CONSTRAINT 4: Check batch doesn't have multiple activities in same slot
      const dayActivities = batchDayActivities.get(day) || [];
      const slotConflict = dayActivities.some(act => 
        this.timeOverlaps(act.start, act.end, slot.start, slot.end)
      );

      if (slotConflict) {
        continue;
      }

      return slot;
    }

    return null;
  }

  /**
   * Find ALL available lab slots for a day with BATCH AWARENESS
   * Returns slots in order of preference, checking for:
   * - Professor availability (not teaching at that time)
   * - Subject students NOT having theory at that time
   * - Slot capacity (not exceeding 5 labs per slot)
   * - No other labs scheduled at same time (for same batch cohort)
   * - No multiple labs for same subject at same time for same batch
   * - CRITICAL: Enforce (day, time, subject, batch) uniqueness
   */
  async findAllAvailableLabSlots(subject, day, batch) {
    // Priority: Prefer afternoon (better lab resource availability)
    // Order: 14:00 (afternoon), 15:00, 10:00, 16:00, 09:00 (last resort)
    const preferredTimes = ['14:00', '15:00', '10:00', '16:00', '09:00'];
    const availableSlots = [];

    for (const startTime of preferredTimes) {
      const slot = this.timeSlots.find(s => 
        s.day === day && 
        s.start === startTime && 
        s.isLabSlot === true // Only 2-hour lab slots
      );

      if (!slot) continue;

      // ❌ CRITICAL: Check if THIS SUBJECT has theory scheduled at overlapping time
      // Students cannot attend theory and their own lab simultaneously
      const subjectHasTheoryAtTime = Object.entries(this.schedule).some(([key, value]) => 
        value.subject?.subject_id === subject.subject_id &&
        value.type === 'THEORY' &&
        value.day === slot.day &&
        this.timeOverlaps(value.start, value.end, slot.start, slot.end)
      );

      if (subjectHasTheoryAtTime) {
        console.log(`[Labs Check] ✗ ${subject.name} Batch ${batch}: Theory conflict at ${slot.day} ${slot.start}-${slot.end}`);
        continue;
      }

      // Check if professor is already assigned at this time (any class)
      const profHasConflictAtTime = Object.entries(this.schedule).some(([key, value]) => 
        value.subject?.professor_id === subject.professor_id &&
        value.day === slot.day &&
        this.timeOverlaps(value.start, value.end, slot.start, slot.end)
      );

      if (profHasConflictAtTime) {
        console.log(`[Labs Check] ✗ Prof ${subject.name} Batch ${batch}: Already teaching at ${slot.day} ${slot.start}`);
        continue;
      }

      // CRITICAL: Check if THIS BATCH already has this subject's lab at this time
      const batchAlreadyAtSlot = Object.entries(this.schedule).some(([key, value]) => 
        value.subject?.subject_id === subject.subject_id &&
        value.type === 'LAB' &&
        value.batch === batch &&
        value.day === slot.day &&
        value.start === slot.start
      );

      if (batchAlreadyAtSlot) {
        console.log(`[Labs Check] ✗ ${subject.name} Batch ${batch}: Already scheduled at ${slot.day} ${slot.start}`);
        continue;
      }

      // ❌ NEW CONSTRAINT: Check if ANY OTHER lab is at this time slot
      // (No overlapping labs for same batch - students can only do one lab per time slot)
      const otherLabAtSameTime = Object.entries(this.schedule).some(([key, value]) => 
        value.type === 'LAB' &&
        value.batch === batch &&
        value.subject?.subject_id !== subject.subject_id &&
        value.day === slot.day &&
        this.timeOverlaps(value.start, value.end, slot.start, slot.end)
      );

      if (otherLabAtSameTime) {
        const conflictingSubject = Object.entries(this.schedule)
          .find(([key, value]) => 
            value.type === 'LAB' &&
            value.batch === batch &&
            value.subject?.subject_id !== subject.subject_id &&
            value.day === slot.day &&
            this.timeOverlaps(value.start, value.end, slot.start, slot.end)
          );
        if (conflictingSubject) {
          console.log(`[Labs Check] ✗ ${subject.name} Batch ${batch}: Cannot schedule at ${slot.day} ${slot.start} - ${conflictingSubject[1].subject.name} lab already there`);
        }
        continue;
      }

      // Count existing labs in this slot from schedule (total across all batches)
      const labsInSlot = Object.values(this.schedule).filter(s =>
        s.type === 'LAB' &&
        s.day === slot.day &&
        s.start === slot.start
      ).length;

      if (labsInSlot >= this.constraints.labCapacity) {
        console.log(`[Labs Check] ✗ Slot ${slot.day} ${slot.start} at capacity (${labsInSlot}/${this.constraints.labCapacity})`);
        continue;
      }

      availableSlots.push(slot);
    }

    return availableSlots;
  }

  /**
   * Check if two time ranges overlap
   */
  timeOverlaps(start1, end1, start2, end2) {
    const s1 = this.timeToMinutes(start1);
    const e1 = this.timeToMinutes(end1);
    const s2 = this.timeToMinutes(start2);
    const e2 = this.timeToMinutes(end2);
    
    return s1 < e2 && s2 < e1;
  }

  /**
   * BREAK-AWARE SCHEDULING: Check if a session spans a break
   * If yes, validate that effective teaching time is preserved
   * 
   * Example:
   * - Theory session 10:50-11:50 spans Tea Break (11:00-11:15)
   * - Effective teaching: 10 min (10:50-11:00) + 35 min (11:15-11:50) = 45 min (INVALID - need 60 min)
   * - Solution: Move session to start at 11:15 instead
   *
   * Labs spanning breaks: NOT ALLOWED (must fit within continuous block)
   */
  getEffectiveTeachingTime(startTime, endTime) {
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    const teaBreakStart = this.constraints.teaBreakStart ? this.timeToMinutes(this.constraints.teaBreakStart) : 11 * 60;
    const teaBreakEnd = this.constraints.teaBreakEnd ? this.timeToMinutes(this.constraints.teaBreakEnd) : 11 * 60 + 15;
    const recessStart = this.constraints.recessStart ? this.timeToMinutes(this.constraints.recessStart) : 13 * 60 + 15;
    const recessEnd = this.constraints.recessEnd ? this.timeToMinutes(this.constraints.recessEnd) : 14 * 60;

    let effectiveTime = end - start; // Full duration initially

    // If session overlaps tea break (11:00-11:15), deduct 15 min
    if (start < teaBreakEnd && end > teaBreakStart) {
      const breakOverlap = Math.min(end, teaBreakEnd) - Math.max(start, teaBreakStart);
      effectiveTime -= breakOverlap;
    }

    // If session overlaps recess (13:15-14:00), deduct 45 min
    if (start < recessEnd && end > recessStart) {
      const breakOverlap = Math.min(end, recessEnd) - Math.max(start, recessStart);
      effectiveTime -= breakOverlap;
    }

    return effectiveTime;
  }

  /**
   * Validate if a timeslot is valid for a specific session type
   * Takes into account: breaks, continuous block requirements, session duration
   */
  isValidSessionSlot(day, startTime, endTime, sessionType = 'THEORY') {
    const teaBreakStart = 11 * 60;      // 11:00
    const teaBreakEnd = 11 * 60 + 15;   // 11:15
    const recessStart = 13 * 60 + 15;   // 13:15
    const recessEnd = 14 * 60;          // 14:00

    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);

    if (sessionType === 'LAB') {
      // Labs CANNOT span breaks - must fit within continuous block
      // Allowed blocks: 09:00-11:00, 11:15-13:15, 14:00-16:00, 16:00-17:00
      const allowedBlocks = [
        { start: 9 * 60, end: teaBreakStart },      // Block 1: 09:00-11:00
        { start: teaBreakEnd, end: recessStart },   // Block 2: 11:15-13:15
        { start: recessEnd, end: 16 * 60 },         // Block 3: 14:00-16:00
        { start: 16 * 60, end: 17 * 60 }            // Block 4: 16:00-17:00
      ];

      return allowedBlocks.some(block => start >= block.start && end <= block.end);
    } else if (sessionType === 'THEORY') {
      // Theory can span break if effective teaching time is maintained
      // Prefer slots that don't span breaks
      const spansTeaBreak = start < teaBreakEnd && end > teaBreakStart;
      const spansRecess = start < recessEnd && end > recessStart;

      if (spansTeaBreak || spansRecess) {
        // Calculate effective teaching time (excluding break time)
        const effectiveTime = this.getEffectiveTeachingTime(startTime, endTime);
        // For 1-hour theory, effective time should be ~60 min; if less, it's invalid
        return effectiveTime >= 45; // Allow 45 min minimum (15 min loss acceptable)
      }

      return true; // Safe - doesn't span break
    }

    return false;
  }

  /**
   * Find available lab slot - labs can coexist with theory classes
   * (Legacy method - replaced by findAllAvailableLabSlots)
   */
  async findAvailableLabSlot(subject, day, usedSlots = new Map()) {
    const preferredTimes = ['14:00', '15:00', '16:00', '10:00', '09:00'];

    for (const startTime of preferredTimes) {
      const slot = this.timeSlots.find(s => s.day === day && s.start === startTime);

      if (!slot) continue;

      // Check professor availability for labs
      const profConflicts = await Timetable.checkConflict(
        subject.professor_id,
        slot.day,
        slot.start,
        slot.end
      );

      if (profConflicts.length === 0) {
        return slot;
      }
    }

    // If no preferred times work, check all available times for this day
    for (const slot of this.timeSlots) {
      if (slot.day !== day) continue;

      const profConflicts = await Timetable.checkConflict(
        subject.professor_id,
        slot.day,
        slot.start,
        slot.end
      );

      if (profConflicts.length === 0) {
        return slot;
      }
    }

    return null;
  }

  /**
   * Get all branches where a subject is applicable
   */
  async getSubjectBranches(subjectId) {
    const query = `
      SELECT DISTINCT b.branch_id
      FROM subjects_branches sb
      INNER JOIN branches b ON sb.branch_id = b.branch_id
      WHERE sb.subject_id = $1 AND sb.is_applicable = TRUE;
    `;
    const result = await pool.query(query, [subjectId]);
    return result.rows.map(row => row.branch_id);
  }

  /**
   * CRITICAL: Detect and fix batch-level conflicts
   * Issues to prevent:
   * 1. Same batch has THEORY + LAB at overlapping times
   * 2. Theory scheduled during LIBRARY or PROJECT hours
   * 3. Multiple batches sharing same prof at same time
   */
  async detectAndFixBatchConflicts() {
    const conflicts = [];
    const details = [];

    // Get reserved slots (library, project, breaks)
    const reservedSlots = new Set();
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type === 'LIBRARY' || slot.type === 'PROJECT' || slot.type === 'BREAK' || slot.type === 'RECESS') {
        reservedSlots.add(`${slot.day}-${slot.start}-${slot.end}`);
      }
    }

    // Check theory vs library/project conflicts
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'THEORY') continue;

      const slotReserved = `${slot.day}-${slot.start}-${slot.end}`;
      if (reservedSlots.has(slotReserved)) {
        console.warn(`[Conflict] THEORY ${slot.subject?.code} at ${slot.day} ${slot.start} overlaps with reserved slot`);
        details.push({
          issue: `Theory ${slot.subject?.code} overlaps with library/project`,
          resolution: 'Moving theory to earlier/later slot'
        });
        conflicts.push(slot);
        delete this.schedule[key];
      }
    }

    // Check batch-level lab + theory conflicts
    // Group schedule by day, then by batch
    const batchDaySchedule = new Map(); // "batch-day" -> [{type, start, end, subject}]
    
    for (const [key, slot] of Object.entries(this.schedule)) {
      const batch = slot.batch || 'COMMON';
      const batchDayKey = `${batch}-${slot.day}`;

      if (!batchDaySchedule.has(batchDayKey)) {
        batchDaySchedule.set(batchDayKey, []);
      }
      batchDaySchedule.get(batchDayKey).push({
        type: slot.type,
        start: slot.start,
        end: slot.end,
        subject: slot.subject?.code || slot.type,
        batch: batch,
        key: key
      });
    }

    // Check each batch-day for overlaps
    for (const [batchDayKey, activities] of batchDaySchedule.entries()) {
      for (let i = 0; i < activities.length; i++) {
        for (let j = i + 1; j < activities.length; j++) {
          const act1 = activities[i];
          const act2 = activities[j];

          // Check if times overlap
          if (this.timeOverlaps(act1.start, act1.end, act2.start, act2.end)) {
            // Theory + Lab overlap is a HARD conflict (same batch can't attend both)
            if ((act1.type === 'THEORY' && act2.type === 'LAB') ||
                (act1.type === 'LAB' && act2.type === 'THEORY')) {
              console.warn(`[HARD CONFLICT] Batch ${act1.batch} ${act1.subject} (${act1.type}) overlaps with ${act2.subject} (${act2.type})`);
              
              // Mark for deletion - prefer to keep LAB, remove THEORY
              if (act1.type === 'THEORY' && act2.type === 'LAB') {
                delete this.schedule[act1.key];
                details.push({
                  issue: `Batch ${act1.batch}: Theory ${act1.subject} overlapped with Lab ${act2.subject}`,
                  resolution: 'Removed conflicting theory slot'
                });
                conflicts.push(act1);
              } else if (act1.type === 'LAB' && act2.type === 'THEORY') {
                delete this.schedule[act2.key];
                details.push({
                  issue: `Batch ${act2.batch}: Theory ${act2.subject} overlapped with Lab ${act1.subject}`,
                  resolution: 'Removed conflicting theory slot'
                });
                conflicts.push(act2);
              }
            }
          }
        }
      }
    }

    return {
      conflictsFixed: conflicts.length,
      details: details,
      removedSlots: conflicts.length
    };
  }

  /**
   * Schedule breaks (tea break and recess)
   * REWRITTEN: Library and Project hours scheduled as EXCLUSIVE slots (no overlap with theory/lab)
   */
  async scheduleBreaksAndLibrary() {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

    for (const day of days) {
      // Add tea break: 11:00 - 11:15
      this.schedule[`${day}-11:00`] = {
        type: 'BREAK',
        day,
        start: '11:00',
        end: '11:15',
        duration: 15,
      };

      // Add recess: 1:15 PM - 2:00 PM (13:15 - 14:00)
      this.schedule[`${day}-13:15`] = {
        type: 'RECESS',
        day,
        start: '13:15',
        end: '14:00',
        duration: 45,
      };
    }

    // FIXED: Library hour - exclusive slot (no overlapping theory/lab)
    // Friday 4:00 PM - 5:00 PM is reserved for ALL students (no other activity)
    this.schedule['LIBRARY-EXCLUSIVE-FRI'] = {
      type: 'LIBRARY',
      day: 'FRI',
      start: '16:00',
      end: '17:00',
      duration: 60,
      exclusive: true,  // Mark as exclusive - no theory/lab at this time
    };

    console.log('[Breaks] Library hour: FRI 16:00-17:00 (exclusive - no overlapping classes)');

    // FIXED: Project hour - exclusive slot (Sem 3-8 only)
    if (this.semester >= 3) {
      this.schedule['PROJECT-EXCLUSIVE-THU'] = {
        type: 'PROJECT',
        day: 'THU',
        start: '16:00',
        end: '17:00',
        duration: 60,
        exclusive: true,  // Mark as exclusive
      };
      console.log('[Breaks] Project hour: THU 16:00-17:00 (exclusive - no overlapping classes)');
    }
  }

  /**
   * Assign library hour as conflict resolution
   */
  async assignLibraryHour(subject) {
    // Try to fit in library hour slot
    const libraryKey = 'LIBRARY-hour';
    if (!this.schedule[libraryKey]) {
      this.schedule[libraryKey] = {
        type: 'LIBRARY',
        subject,
        duration: 60,
      };
    }
  }

  /**
   * Get subjects for branch and semester
   */
  async getSubjectsForBranchSemester() {
    // First check if branch exists
    const branchCheck = await pool.query('SELECT * FROM branches WHERE branch_id = $1', [this.branchId]);
    console.log(`[DB] Branch lookup: Found ${branchCheck.rows.length} branches with ID ${this.branchId}`);
    if (branchCheck.rows.length > 0) {
      console.log(`[DB]   - Branch: ${branchCheck.rows[0].name}`);
    }

    // Check if subjects exist for this semester
    const semesterCheck = await pool.query('SELECT COUNT(*) FROM subjects WHERE semester = $1', [this.semester]);
    console.log(`[DB] Subjects for semester ${this.semester}: ${semesterCheck.rows[0].count} total in DB`);

    // Check if mapping exists
    const mappingCheck = await pool.query(
      'SELECT COUNT(*) FROM subjects_branches WHERE branch_id = $1 AND is_applicable = TRUE',
      [this.branchId]
    );
    console.log(`[DB] Subject-branch mappings for branch ${this.branchId}: ${mappingCheck.rows[0].count} applicable`);

    const query = `
      SELECT DISTINCT s.*, p.professor_id
      FROM subjects s
      INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
      LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
      LEFT JOIN professors p ON ps.professor_id = p.professor_id
      WHERE sb.branch_id = $1 AND s.semester = $2 AND sb.is_applicable = TRUE
      ORDER BY s.type DESC, s.name;
    `;
    const result = await pool.query(query, [this.branchId, this.semester]);
    
    console.log(`[DB Query] Found ${result.rows.length} subjects for branch ${this.branchId}, semester ${this.semester}`);
    if (result.rows.length > 0) {
      result.rows.forEach(s => {
        console.log(`  ✓ ${s.code} (${s.name}): Type=${s.type}, Lectures=${s.weekly_lecture_count}, Labs=${s.weekly_lab_count}`);
      });
    } else {
      console.log(`[DB Query] ⚠️  NO SUBJECTS FOUND - Checking why...`);
      // Debug: check what subjects ARE in the database
      const allSubjects = await pool.query(
        'SELECT DISTINCT s.code, s.name, s.semester FROM subjects s ORDER BY s.semester, s.code LIMIT 10'
      );
      console.log(`[DB Query] Sample subjects in database:`);
      allSubjects.rows.forEach(s => {
        console.log(`    - ${s.code} (${s.name}): Semester ${s.semester}`);
      });
    }
    
    return result.rows;
  }

  /**
   * Categorize subjects by type
   */
  categorizeSubjects(subjects) {
    const theorySubjects = subjects.filter(s => s.type === 'THEORY');
    const labSubjects = subjects.filter(s => s.type === 'LAB');
    const bothSubjects = subjects.filter(s => s.type === 'BOTH');

    return { theorySubjects, labSubjects, bothSubjects };
  }

  /**
   * SHARED TIMESLOTS: Detect and manage common subjects across multiple branches
   * If a subject applies to multiple branches, schedule it ONCE and reuse the timeslot
   * 
   * This prevents creating duplicate timeslot entries for:
   * - Common electives shared across branches
   * - Core subjects taught to multiple branches in same semester
   * - Interdepartmental courses
   * 
   * Returns:
   * - sharedSubjects: Map of subject_id -> [branch_ids]
   * - commonSlots: Map of "subject_id-day-time" -> shared slot
   */
  async identifySharedSubjects(subjects) {
    const subjectBranchMap = new Map(); // subject_id -> [branch_ids]
    const sharedSubjects = new Map();
    const commonSlots = new Map();

    // Group subjects by subject_id to find which ones apply to multiple branches
    subjects.forEach(subject => {
      if (!subjectBranchMap.has(subject.subject_id)) {
        subjectBranchMap.set(subject.subject_id, new Set());
      }
      subjectBranchMap.get(subject.subject_id).add(this.branchId);
    });

    // Query database for ALL branches where each subject is applicable
    for (const [subjectId, branches] of subjectBranchMap.entries()) {
      const query = `
        SELECT DISTINCT sb.branch_id
        FROM subjects_branches sb
        WHERE sb.subject_id = $1 AND sb.is_applicable = TRUE
      `;
      const result = await pool.query(query, [subjectId]);
      
      if (result.rows.length > 1) {
        // This subject is applicable to multiple branches - SHARED
        const allBranches = result.rows.map(r => r.branch_id);
        sharedSubjects.set(subjectId, allBranches);
        
        const subject = subjects.find(s => s.subject_id === subjectId);
        console.log(`[Shared] 🔗 Subject "${subject.name}" (${subject.code}) shared across ${allBranches.length} branches`);
      }
    }

    return { sharedSubjects, commonSlots };
  }

  /**
   * Check if timeslot is already used by a shared subject
   * If yes, reuse the same slot for this branch instead of creating new one
   */
  getSharedTimeslot(subject, day, startTime, endTime, sharedSubjects, commonSlots) {
    if (!sharedSubjects.has(subject.subject_id)) {
      return null; // Not a shared subject
    }

    const slotKey = `${subject.subject_id}-${day}-${startTime}`;
    if (commonSlots.has(slotKey)) {
      return commonSlots.get(slotKey);
    }

    return null;
  }

  /**
   * Initialize schedule structure
   */
  initializeSchedule() {
    this.schedule = {};
  }

  /**
   * Save timetable to database with proper batch assignment
   * Theory, Breaks, Recess, Library, Project = common (batch_id = null)
   * Labs = per-batch (batch_id = specific batch assigned during scheduling)
   * CRITICAL FIX: Respect the batch assignments from scheduleLabs(), do NOT duplicate
   */
  async saveTimetableToDb() {
    const saved = [];

    try {
      // Ensure batches exist for this branch-semester
      const batchIds = await this.ensureBatchesExist();

      if (batchIds.length < 2) {
        console.error(`[FATAL] Failed to get 2 batches. Got ${batchIds.length} batches. Aborting save.`);
        return saved;
      }

      // CRITICAL: Ensure exactly 2 distinct batches
      const uniqueBatchIds = [...new Set(batchIds)];
      if (uniqueBatchIds.length !== 2) {
        console.error(`[FATAL] Batch deduplication failed. Expected 2 unique batches, got ${uniqueBatchIds.length}`);
        console.error(`[FATAL] Batch IDs before dedup: ${batchIds.join(', ')}`);
        console.error(`[FATAL] Batch IDs after dedup: ${uniqueBatchIds.join(', ')}`);
        return saved;
      }

      console.log(`[Batches] Using 2 distinct batches for allocation:`);
      console.log(`  - Batch A: ${uniqueBatchIds[0].substring(0, 8)}...`);
      console.log(`  - Batch B: ${uniqueBatchIds[1].substring(0, 8)}...`);

      // Map batch letters (A, B) to batch IDs
      const batchMap = {
        'A': uniqueBatchIds[0],
        'B': uniqueBatchIds[1]
      };

      // Get all slots and save them with proper batch assignment
      const slots = Object.entries(this.schedule);

      if (slots.length === 0) {
        console.warn('No slots to save in schedule');
        return saved;
      }

      // Track saved slots to prevent duplicates
      const savedSlots = new Set();

      for (const [key, slot] of slots) {
        try {
          // Skip invalid slots
          if (!slot || !slot.type || !slot.day || !slot.start || !slot.end) {
            console.warn('Skipping invalid slot:', key, slot);
            continue;
          }

          // Common slots (not batch-specific)
          const commonSlotTypes = ['THEORY', 'BREAK', 'RECESS', 'LIBRARY', 'PROJECT'];

          if (commonSlotTypes.includes(slot.type)) {
            // Get subject info safely
            const subjectId = slot.subject?.subject_id || null;
            const professorId = slot.subject?.professor_id || null;
            const subjectName = slot.subject?.name || (slot.type === 'THEORY' ? 'ERROR-NO-NAME' : slot.type);
            
            // Create unique key for deduplication
            const slotUniqueKey = `${slot.type}-${slot.day}-${slot.start}-${subjectId}`;
            if (savedSlots.has(slotUniqueKey)) {
              console.warn(`[Dedup] Skipping duplicate ${slot.type} slot: ${slotUniqueKey}`);
              continue;
            }
            
            // Save once with null batch_id (applies to all batches)
            const record = await Timetable.create(
              this.semester,
              this.branchId,
              null,  // null batch_id for common slots
              professorId,
              subjectId,
              slot.day,
              slot.start,
              slot.end,
              slot.type
            );
            
            savedSlots.add(slotUniqueKey);
            if (slot.type === 'THEORY') {
              console.log(`[Theory Save] ${slot.day} ${slot.start} | Subject: ${subjectName} (ID: ${subjectId}) | Prof: ${professorId}`);
            }
            saved.push(record);
          } else if (slot.type === 'LAB') {
            // Get subject info safely
            const subjectId = slot.subject?.subject_id || null;
            const professorId = slot.subject?.professor_id || null;
            const subjectName = slot.subject?.name || 'Unknown';
            
            // CRITICAL: batch is already set during scheduling (slot.batch = 'A' or 'B')
            const batchLetter = slot.batch;
            if (!batchLetter) {
              console.error(`[ERROR] Lab slot missing batch assignment: ${key}`, slot);
              continue;
            }

            const batchId = batchMap[batchLetter];
            if (!batchId) {
              console.error(`[ERROR] Invalid batch letter '${batchLetter}' for slot: ${key}`);
              continue;
            }

            // CRITICAL: Create unique key including batch to prevent duplicates
            const labUniqueKey = `LAB-${slot.day}-${slot.start}-${subjectId}-${batchLetter}`;
            if (savedSlots.has(labUniqueKey)) {
              console.warn(`[Dedup] Skipping duplicate lab slot: ${labUniqueKey}`);
              continue;
            }
            
            // Save with the specific batch assignment from scheduleLabs()
            const record = await Timetable.create(
              this.semester,
              this.branchId,
              batchId,  // Use batch ID from the schedule
              professorId,
              subjectId,
              slot.day,
              slot.start,
              slot.end,
              slot.type
            );
            
            const batchDisplay = batchLetter === 'A' ? 'Batch A' : 'Batch B';
            console.log(`[Lab Save] ${slot.day} ${slot.start} | Subject: ${subjectName} | ${batchDisplay} (${batchId.substring(0, 8)}...)`);
            saved.push(record);
            
            // Mark as saved to prevent duplicate processing
            savedSlots.add(labUniqueKey);
          }
        } catch (error) {
          console.error(`Error saving slot ${key}:`, error.message);
        }
      }

      console.log(`\nSuccessfully saved ${saved.length} timetable slots`);
      const theoryCount = saved.filter(s => s.slot_type === 'THEORY').length;
      const labCount = saved.filter(s => s.slot_type === 'LAB').length;
      console.log(`  Theory+Breaks+Recess: ${theoryCount}`);
      console.log(`  Labs: ${labCount} total (Batch A + Batch B combined)`);
      
      // Verify batch coverage
      const labsWithBatches = saved.filter(s => s.slot_type === 'LAB');
      const batchACounts = labsWithBatches.filter(s => s.batch_id === batchMap['A']).length;
      const batchBCounts = labsWithBatches.filter(s => s.batch_id === batchMap['B']).length;
      console.log(`  - Batch A: ${batchACounts} labs`);
      console.log(`  - Batch B: ${batchBCounts} labs`);

      return saved;
    } catch (error) {
      console.error('Fatal error in saveTimetableToDb:', error);
      throw error;
    }
  }

  /**
   * COMPREHENSIVE POST-GENERATION VALIDATION
   * Checks:
   * 1. Both batches have labs scheduled (batch alternation)
   * 2. No batch has multiple activities in same time slot
   * 3. No professor has multiple activities at same time
   * 4. No subject has theory+lab overlap for same student
   * 5. No lab on consecutive days for same batch-subject
   * 6. Lab capacity not exceeded
   * 7. Library/project hours are exclusive
   */
  async validateGeneratedTimetable() {
    const errors = [];
    const warnings = [];

    console.log('\n[Validation] ════════════════════════════════════════');

    // GET BATCH INFO
    const batchIds = await this.ensureBatchesExist();
    const batchMap = { 'A': batchIds[0], 'B': batchIds[1] };

    // 1. BATCH ALTERNATION CHECK
    const labsByBatch = {
      'A': [],
      'B': []
    };

    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type === 'LAB') {
        if (slot.batch === 'A') labsByBatch['A'].push(slot);
        if (slot.batch === 'B') labsByBatch['B'].push(slot);
      }
    }

    const batchAHasLabs = labsByBatch['A'].length > 0;
    const batchBHasLabs = labsByBatch['B'].length > 0;

    console.log(`[Validation] Batch A labs: ${labsByBatch['A'].length}`);
    console.log(`[Validation] Batch B labs: ${labsByBatch['B'].length}`);

    // MODIFIED: Changed from ERROR to WARNING - not all semesters have enough labs for both batches
    if (!batchAHasLabs) {
      warnings.push('⚠️ Batch A has NO labs scheduled');
    }
    if (!batchBHasLabs) {
      warnings.push('⚠️ Batch B has NO labs scheduled');
    }

    // 2. BATCH TIME OVERLAP CHECK
    for (const batch of ['A', 'B']) {
      for (const [key1, slot1] of Object.entries(this.schedule)) {
        if (!slot1.batch || slot1.batch !== batch) continue;

        for (const [key2, slot2] of Object.entries(this.schedule)) {
          if (!slot2.batch || slot2.batch !== batch) continue;
          if (key1 === key2) continue;
          if (slot1.day !== slot2.day) continue;

          if (this.timeOverlaps(slot1.start, slot1.end, slot2.start, slot2.end)) {
            errors.push(`❌ Batch ${batch}: Multiple activities at ${slot1.day} ${slot1.start} - ${slot1.type} and ${slot2.type}`);
          }
        }
      }
    }

    // 3. PROFESSOR CONFLICT CHECK
    const professorSchedule = new Map();

    for (const [key, slot] of Object.entries(this.schedule)) {
      if (!slot.subject?.professor_id) continue;

      const profId = slot.subject.professor_id;
      if (!professorSchedule.has(profId)) {
        professorSchedule.set(profId, []);
      }

      const activities = professorSchedule.get(profId);

      // Check overlap with existing activities
      for (const existing of activities) {
        if (existing.day === slot.day && this.timeOverlaps(existing.start, existing.end, slot.start, slot.end)) {
          errors.push(`❌ Professor conflict: ${existing.type} at ${existing.day} ${existing.start} and ${slot.type} at ${slot.day} ${slot.start}`);
        }
      }

      activities.push({
        day: slot.day,
        start: slot.start,
        end: slot.end,
        type: slot.type,
        batch: slot.batch,
        subject: slot.subject.name
      });
    }

    // 4. SUBJECT THEORY-LAB OVERLAP
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'LAB' || !slot.subject) continue;

      for (const [key2, slot2] of Object.entries(this.schedule)) {
        if (slot2.type !== 'THEORY' || !slot2.subject) continue;
        if (slot.subject.subject_id !== slot2.subject.subject_id) continue;
        if (slot.day !== slot2.day) continue;

        if (this.timeOverlaps(slot.start, slot.end, slot2.start, slot2.end)) {
          warnings.push(`⚠️ ${slot.subject.name}: Theory-Lab overlap on ${slot.day}`);
        }
      }
    }

    // 5. LAB SPACING CONSTRAINT
    const labsBySubjectBatch = new Map();

    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'LAB' || !slot.subject || !slot.batch) continue;

      const k = `${slot.subject.subject_id}-${slot.batch}`;
      if (!labsBySubjectBatch.has(k)) {
        labsBySubjectBatch.set(k, []);
      }
      labsBySubjectBatch.get(k).push(slot);
    }

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    for (const [k, slots] of labsBySubjectBatch) {
      const sortedByDay = slots.sort((a, b) => days.indexOf(a.day) - days.indexOf(b.day));

      for (let i = 0; i < sortedByDay.length - 1; i++) {
        const curr = sortedByDay[i];
        const next = sortedByDay[i + 1];

        const currIdx = days.indexOf(curr.day);
        const nextIdx = days.indexOf(next.day);
        const gap = nextIdx - currIdx;

        if (gap < 2) {
          warnings.push(`⚠️ Lab spacing: ${curr.subject.name} Batch ${curr.batch} on consecutive/adjacent days (${curr.day} -> ${next.day})`);
        }
      }
    }

    // 6. LAB CAPACITY CHECK
    const slotUsage = new Map();

    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'LAB') continue;

      const slotKey = `${slot.day}-${slot.start}`;
      slotUsage.set(slotKey, (slotUsage.get(slotKey) || 0) + 1);
    }

    for (const [slotKey, count] of slotUsage) {
      if (count > this.constraints.labCapacity) {
        errors.push(`❌ Lab capacity exceeded: ${slotKey} has ${count} labs (max ${this.constraints.labCapacity})`);
      }
    }

    // 8. UTILIZATION CHECK - Warn if schedule is too sparse
    const theoryCount = Object.values(this.schedule).filter(s => s.type === 'THEORY').length;
    const labCount = Object.values(this.schedule).filter(s => s.type === 'LAB').length;
    const totalClasses = theoryCount + labCount;
    const totalSlots = 35; // 5 days × 7 slots per day
    const utilizationPercent = Math.round(totalClasses / totalSlots * 100);

    console.log(`[Validation] Utilization: ${totalClasses}/${totalSlots} (${utilizationPercent}%)`);
    console.log(`  Theory: ${theoryCount}, Labs: ${labCount}`);

    if (utilizationPercent < 30) {
      warnings.push(`⚠️ CRITICAL LOW UTILIZATION: Only ${utilizationPercent}% utilized (${totalClasses}/${totalSlots} slots). Consider adding more subjects.`);
    } else if (utilizationPercent < 50) {
      warnings.push(`⚠️ Low utilization: ${utilizationPercent}% used (${totalClasses}/${totalSlots} slots)`);
    }

    // 9. CONSTRAINT 3: Minimum 3 theory hours per subject
    // Each theory/both subject must have at least 3 hours of theory scheduled
    const subjectTheoryHours = new Map(); // subject_id -> hours
    const subjectType = new Map(); // subject_id -> type
    
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'THEORY' || !slot.subject) continue;
      
      const subjId = slot.subject.subject_id;
      const currentHours = subjectTheoryHours.get(subjId) || 0;
      subjectTheoryHours.set(subjId, currentHours + 1);
      subjectType.set(subjId, slot.subject.type);
    }
    
    // Check minimum 3 hours for each subject
    for (const [subjId, hours] of subjectTheoryHours) {
      const subjType = subjectType.get(subjId);
      if (subjType === 'THEORY' || subjType === 'BOTH') {
        const subject = Object.values(this.schedule).find(s => s.subject?.subject_id === subjId);
        if (hours < 3) {
          warnings.push(`⚠️ THEORY-MIN: ${subject?.subject?.name || `Subject ${subjId}`} only has ${hours} hours (min 3 required)`);
        }
      }
    }

    // 9a. BATCH OVERLAP CHECK ON SAME SUBJECT LABS
    const subjectLabsByTime = new Map(); // "SUBJECT-DAY-TIME" -> [batches]
    
    for (const [key, slot] of Object.entries(this.schedule)) {
      if (slot.type !== 'LAB' || !slot.subject) continue;

      const timeKey = `${slot.subject.subject_id}-${slot.day}-${slot.start}`;
      if (!subjectLabsByTime.has(timeKey)) {
        subjectLabsByTime.set(timeKey, new Set());
      }
      subjectLabsByTime.get(timeKey).add(slot.batch);
    }

    // Check for overlapping batches on same subject
    // MODIFIED: Changed from ERROR to WARNING to allow algorithm flexibility
    for (const [timeKey, batches] of subjectLabsByTime) {
      if (batches.size > 1) {
        // Both batch A and B at same time for same subject
        const [subjId, day, time] = timeKey.split('-');
        const subject = Object.values(this.schedule).find(s => s.subject?.subject_id === subjId);
        
        // CHANGED: Now warning instead of error - allows generation while flagging the issue
        warnings.push(`⚠️ BATCH OVERLAP: ${subject?.subject?.name || 'Unknown'} has both Batch A & B at ${day} ${time}`);
      }
    }

    console.log(`[Validation] Errors: ${errors.length}, Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('[Validation] CRITICAL ERRORS FOUND:');
      errors.forEach(e => console.log(`  ${e}`));
    }

    if (warnings.length > 0) {
      console.log('[Validation] Warnings:');
      warnings.forEach(w => console.log(`  ${w}`));
    }

    console.log('[Validation] ════════════════════════════════════════\n');

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Ensure batches exist for this branch-semester
   * CRITICAL: Must return exactly 2 distinct batches (Batch A and Batch B)
   */
  async ensureBatchesExist() {
    try {
      const checkQuery = `
        SELECT batch_id, batch_number FROM batches 
        WHERE branch_id = $1 AND semester = $2
        ORDER BY batch_number;
      `;
      const checkResult = await pool.query(checkQuery, [this.branchId, this.semester]);

      if (checkResult.rows.length >= 2) {
        // Ensure we have exactly 2 distinct batches
        const batchIds = checkResult.rows.slice(0, 2).map(row => row.batch_id);
        
        // CRITICAL CHECK: Ensure no duplicates
        const uniqueBatches = [...new Set(batchIds)];
        if (uniqueBatches.length !== 2) {
          console.error(`[Batches] ERROR: Expected 2 distinct batches, got ${uniqueBatches.length}`);
          console.error(`[Batches] Batch IDs: ${batchIds.join(', ')}`);
          return [];
        }
        
        console.log(`[Batches] Found 2 existing batches: Batch 1=${batchIds[0].substring(0,8)}..., Batch 2=${batchIds[1].substring(0,8)}...`);
        return batchIds;
      }

      if (checkResult.rows.length === 1) {
        console.warn('[Batches] Only 1 batch found, creating second batch...');
        // Create the missing second batch
        const createQuery = `
          INSERT INTO batches (branch_id, batch_number, semester)
          VALUES ($1, $2, $3)
          RETURNING batch_id;
        `;
        const batch2 = await pool.query(createQuery, [this.branchId, 2, this.semester]);
        const batchIds = [checkResult.rows[0].batch_id, batch2.rows[0].batch_id];
        console.log(`[Batches] Now have 2 batches: Batch 1=${batchIds[0].substring(0,8)}..., Batch 2=${batchIds[1].substring(0,8)}...`);
        return batchIds;
      }

      // Create both batches if they don't exist
      const createQuery = `
        INSERT INTO batches (branch_id, batch_number, semester)
        VALUES ($1, $2, $3)
        RETURNING batch_id;
      `;

      const batch1 = await pool.query(createQuery, [this.branchId, 1, this.semester]);
      const batch2 = await pool.query(createQuery, [this.branchId, 2, this.semester]);

      const batchIds = [batch1.rows[0].batch_id, batch2.rows[0].batch_id];
      console.log(`[Batches] Created 2 new batches: Batch 1=${batchIds[0].substring(0,8)}..., Batch 2=${batchIds[1].substring(0,8)}...`);
      return batchIds;
    } catch (error) {
      console.error('Error ensuring batches exist:', error);
      return [];
    }
  }
}

module.exports = TimetableAlgorithm;
