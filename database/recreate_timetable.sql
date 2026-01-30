-- Clear existing timetable data
DELETE FROM timetable;

-- Drop and recreate the timetable table with correct constraints
DROP TABLE IF EXISTS timetable;

CREATE TABLE timetable (
  timetable_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semester INT NOT NULL CHECK (semester >= 1 AND semester <= 8),
  branch_id UUID NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
  batch_id UUID REFERENCES batches(batch_id) ON DELETE SET NULL,
  professor_id UUID REFERENCES professors(professor_id) ON DELETE SET NULL,
  subject_id UUID REFERENCES subjects(subject_id) ON DELETE SET NULL,
  day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('MON', 'TUE', 'WED', 'THU', 'FRI')),
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  slot_type VARCHAR(50) NOT NULL CHECK (slot_type IN ('THEORY', 'LAB', 'LIBRARY', 'BREAK', 'RECESS')),
  room_id VARCHAR(50),
  lab_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  version INT DEFAULT 1
);

CREATE INDEX idx_timetable_branch ON timetable(branch_id);
CREATE INDEX idx_timetable_semester ON timetable(semester);
CREATE INDEX idx_timetable_professor ON timetable(professor_id);
CREATE INDEX idx_timetable_batch ON timetable(batch_id);
