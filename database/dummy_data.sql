-- SmartTT Dummy Data
-- Run this after schema.sql to populate test data

-- Clear existing data
DELETE FROM student_feedback;
DELETE FROM assignments;
DELETE FROM timetable;
DELETE FROM professors_subjects;
DELETE FROM subjects_branches;
DELETE FROM batches;
DELETE FROM time_slots;
DELETE FROM subjects;
DELETE FROM professors;
DELETE FROM branches;

-- ===== INSERT BRANCHES =====
INSERT INTO branches (name, code) VALUES
('Computer Science', 'CS'),
('Internet of Things', 'IoT'),
('Artificial Intelligence & Machine Learning', 'AIML');

-- ===== INSERT PROFESSORS (25 professors) =====
INSERT INTO professors (name, email, department) VALUES
('Dr. Rajesh Kumar', 'rajesh.kumar@university.edu', 'CS'),
('Prof. Priya Singh', 'priya.singh@university.edu', 'CS'),
('Dr. Amit Patel', 'amit.patel@university.edu', 'CS'),
('Prof. Neha Sharma', 'neha.sharma@university.edu', 'CS'),
('Dr. Vikram Reddy', 'vikram.reddy@university.edu', 'CS'),
('Prof. Anjali Gupta', 'anjali.gupta@university.edu', 'IoT'),
('Dr. Suresh Verma', 'suresh.verma@university.edu', 'IoT'),
('Prof. Divya Nair', 'divya.nair@university.edu', 'IoT'),
('Dr. Rohan Desai', 'rohan.desai@university.edu', 'IoT'),
('Prof. Meera Iyer', 'meera.iyer@university.edu', 'IoT'),
('Dr. Sanjay Joshi', 'sanjay.joshi@university.edu', 'AIML'),
('Prof. Kavya Menon', 'kavya.menon@university.edu', 'AIML'),
('Dr. Arjun Nair', 'arjun.nair@university.edu', 'AIML'),
('Prof. Sneha Deshmukh', 'sneha.deshmukh@university.edu', 'AIML'),
('Dr. Deepak Singh', 'deepak.singh@university.edu', 'AIML'),
('Prof. Riya Chatterjee', 'riya.chatterjee@university.edu', 'CS'),
('Dr. Harsh Yadav', 'harsh.yadav@university.edu', 'CS'),
('Prof. Zara Khan', 'zara.khan@university.edu', 'IoT'),
('Dr. Nikhil Sinha', 'nikhil.sinha@university.edu', 'AIML'),
('Prof. Priyanka Roy', 'priyanka.roy@university.edu', 'CS'),
('Dr. Siddharth Mishra', 'siddharth.mishra@university.edu', 'IoT'),
('Prof. Akshita Verma', 'akshita.verma@university.edu', 'AIML'),
('Dr. Rahul Bhat', 'rahul.bhat@university.edu', 'CS'),
('Prof. Tanvi Chopra', 'tanvi.chopra@university.edu', 'IoT'),
('Dr. Vishal Singhal', 'vishal.singhal@university.edu', 'AIML');

-- ===== INSERT SUBJECTS =====
INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count, credits) VALUES
-- Semester 1
('Programming Fundamentals', 'CS101', 'BOTH', 1, 3, 2, 4),
('Digital Logic Design', 'CS102', 'BOTH', 1, 3, 2, 4),
('Mathematics I', 'CS103', 'THEORY', 1, 4, 0, 4),
('Physics I', 'CS104', 'THEORY', 1, 3, 0, 3),

-- Semester 2
('Data Structures', 'CS201', 'BOTH', 2, 3, 2, 4),
('Object Oriented Programming', 'CS202', 'BOTH', 2, 3, 2, 4),
('Mathematics II', 'CS203', 'THEORY', 2, 4, 0, 4),
('Web Development', 'CS204', 'BOTH', 2, 2, 2, 3),

-- Semester 3
('Database Management Systems', 'CS301', 'BOTH', 3, 3, 2, 4),
('Operating Systems', 'CS302', 'THEORY', 3, 3, 0, 3),
('Algorithms', 'CS303', 'BOTH', 3, 3, 1, 3),
('Computer Networks', 'CS304', 'BOTH', 3, 2, 2, 3),

-- Semester 4
('Machine Learning', 'CS401', 'BOTH', 4, 3, 2, 4),
('Artificial Intelligence', 'CS402', 'THEORY', 4, 3, 0, 3),
('Web Services', 'CS403', 'BOTH', 4, 2, 2, 3),
('Software Engineering', 'CS404', 'THEORY', 4, 3, 0, 3),

-- IoT Specific Subjects
('IoT Fundamentals', 'IoT101', 'BOTH', 1, 2, 2, 3),
('Embedded Systems', 'IoT102', 'BOTH', 2, 3, 2, 4),
('Sensor Networks', 'IoT201', 'BOTH', 3, 2, 2, 3),
('Cloud Computing for IoT', 'IoT202', 'BOTH', 4, 2, 1, 2),

-- AIML Specific Subjects
('AI Fundamentals', 'AIML101', 'THEORY', 1, 3, 0, 3),
('Python for ML', 'AIML102', 'BOTH', 2, 2, 2, 3),
('Deep Learning', 'AIML201', 'BOTH', 3, 3, 2, 4),
('NLP Basics', 'AIML202', 'THEORY', 4, 3, 0, 3);

-- ===== INSERT SUBJECTS_BRANCHES =====
-- CS Subjects
INSERT INTO subjects_branches (subject_id, branch_id, is_applicable) 
SELECT s.subject_id, b.branch_id, TRUE 
FROM subjects s, branches b 
WHERE s.code LIKE 'CS%' AND b.code = 'CS';

-- IoT Subjects
INSERT INTO subjects_branches (subject_id, branch_id, is_applicable) 
SELECT s.subject_id, b.branch_id, TRUE 
FROM subjects s, branches b 
WHERE s.code LIKE 'IoT%' AND b.code = 'IoT';

-- AIML Subjects
INSERT INTO subjects_branches (subject_id, branch_id, is_applicable) 
SELECT s.subject_id, b.branch_id, TRUE 
FROM subjects s, branches b 
WHERE s.code LIKE 'AIML%' AND b.code = 'AIML';

-- Common subjects for all branches
INSERT INTO subjects_branches (subject_id, branch_id, is_applicable)
SELECT s.subject_id, b.branch_id, TRUE
FROM subjects s, branches b
WHERE s.code IN ('CS101', 'CS102', 'CS103', 'CS104');

-- ===== INSERT PROFESSORS_SUBJECTS MAPPING =====
-- Map CS professors to CS subjects
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM professors p, subjects s
WHERE p.department = 'CS' AND s.code IN ('CS101', 'CS102', 'CS201', 'CS202', 'CS301', 'CS302', 'CS303', 'CS304', 'CS401', 'CS402', 'CS403', 'CS404')
LIMIT 5;

-- Map IoT professors to IoT subjects
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM professors p, subjects s
WHERE p.department = 'IoT' AND s.code IN ('IoT101', 'IoT102', 'IoT201', 'IoT202')
LIMIT 5;

-- Map AIML professors to AIML subjects
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM professors p, subjects s
WHERE p.department = 'AIML' AND s.code IN ('AIML101', 'AIML102', 'AIML201', 'AIML202')
LIMIT 5;

-- ===== INSERT BATCHES =====
INSERT INTO batches (branch_id, batch_number, semester)
SELECT b.branch_id, batch_num, sem
FROM branches b
CROSS JOIN (SELECT 1 as batch_num UNION SELECT 2) bn
CROSS JOIN (SELECT 1 as sem UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) s;

-- ===== INSERT TIME SLOTS =====
INSERT INTO time_slots (start_time, end_time, duration_minutes, slot_label) VALUES
('09:00:00', '10:00:00', 60, '9:00-10:00'),
('10:00:00', '11:00:00', 60, '10:00-11:00'),
('11:00:00', '12:00:00', 60, '11:00-12:00'),
('12:00:00', '12:45:00', 45, 'RECESS'),
('12:45:00', '13:00:00', 15, 'TEA BREAK'),
('13:00:00', '14:00:00', 60, '1:00-2:00'),
('14:00:00', '15:00:00', 60, '2:00-3:00'),
('15:00:00', '16:00:00', 60, '3:00-4:00'),
('16:00:00', '17:00:00', 60, '4:00-5:00');

COMMIT;
