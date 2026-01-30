-- Drop the existing constraints
ALTER TABLE timetable
DROP CONSTRAINT timetable_professor_id_fkey,
DROP CONSTRAINT timetable_subject_id_fkey;

-- Make columns nullable
ALTER TABLE timetable
ALTER COLUMN professor_id DROP NOT NULL,
ALTER COLUMN subject_id DROP NOT NULL;

-- Add back the constraints with ON DELETE SET NULL
ALTER TABLE timetable
ADD CONSTRAINT timetable_professor_id_fkey FOREIGN KEY (professor_id) REFERENCES professors(professor_id) ON DELETE SET NULL,
ADD CONSTRAINT timetable_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE SET NULL;
