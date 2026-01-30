-- Check if timetable was generated
SELECT COUNT(*) as "Total Slots for Semester 6" FROM timetable WHERE semester = 6;

-- Show daily breakdown for semester 6
SELECT 
  day_of_week,
  time_slot_start,
  time_slot_end,
  slot_type,
  subject_id,
  professor_id,
  batch_id
FROM timetable 
WHERE semester = 6 
ORDER BY day_of_week, time_slot_start
LIMIT 40;

-- Check for conflicts
SELECT 
  professor_id,
  day_of_week,
  time_slot_start,
  COUNT(*) as num_classes
FROM timetable
WHERE semester = 6 AND professor_id IS NOT NULL
GROUP BY professor_id, day_of_week, time_slot_start
HAVING COUNT(*) > 1;

-- Tea break check
SELECT * FROM timetable WHERE semester = 6 AND slot_type = 'BREAK' AND time_slot_start = '11:00' LIMIT 5;

-- Recess check
SELECT * FROM timetable WHERE semester = 6 AND slot_type = 'RECESS' AND time_slot_start = '13:15' LIMIT 5;
