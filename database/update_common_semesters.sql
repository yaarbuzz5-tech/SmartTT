/**
 * UPDATE COMMON SEMESTERS (1 & 2)
 * 
 * Makes Semester 1 and Semester 2 COMMON across all three branches
 * (Computer Engineering, Artificial Intelligence, Internet of Things)
 * 
 * Sem 1 & 2: Same 6 subjects for ALL branches
 * Sem 3-8: Keep existing branch-specific data unchanged
 * 
 * Professor constraints:
 * - Max 35 unique professors total
 * - Max 5 subjects per professor
 * - One professor per subject (handles both theory and lab)
 */

-- ====================================================================
-- PHASE 1: CLEAR EXISTING SEM 1 & 2 DATA
-- ====================================================================

-- Delete Semester 1 & 2 from timetable (in case any exist)
DELETE FROM timetable 
WHERE semester IN (1, 2);

-- Delete Semester 1 & 2 professor-subject mappings
DELETE FROM professors_subjects 
WHERE subject_id IN (
  SELECT subject_id FROM subjects WHERE semester IN (1, 2)
);

-- Delete Semester 1 & 2 subject-branch mappings
DELETE FROM subjects_branches 
WHERE subject_id IN (
  SELECT subject_id FROM subjects WHERE semester IN (1, 2)
);

-- Delete Semester 1 & 2 subjects
DELETE FROM subjects 
WHERE semester IN (1, 2);

-- ====================================================================
-- PHASE 2: CREATE COMMON SEMESTER 1 SUBJECTS (6 total)
-- ====================================================================

-- 5 Theory + Lab subjects for Semester 1 (COMMON across all branches)
INSERT INTO subjects (subject_id, name, code, type, semester, weekly_lecture_count, weekly_lab_count, total_hours_per_week)
VALUES
  (gen_random_uuid(), 'Mathematics - I', 'MATH-101', 'BOTH', 1, 4, 2, 6),
  (gen_random_uuid(), 'Physics', 'PHY-101', 'BOTH', 1, 3, 2, 5),
  (gen_random_uuid(), 'Engineering Graphics', 'ENG-101', 'BOTH', 1, 2, 4, 6),
  (gen_random_uuid(), 'Programming Fundamentals', 'CS-101', 'BOTH', 1, 3, 2, 5),
  (gen_random_uuid(), 'Digital Logic Design', 'CS-102', 'BOTH', 1, 3, 2, 5);

-- 1 Lab-only subject for Semester 1 (COMMON across all branches)
INSERT INTO subjects (subject_id, name, code, type, semester, weekly_lecture_count, weekly_lab_count, total_hours_per_week)
VALUES
  (gen_random_uuid(), 'Engineering Workshop', 'ENG-102', 'LAB', 1, 0, 4, 4);

-- ====================================================================
-- PHASE 3: CREATE COMMON SEMESTER 2 SUBJECTS (6 total)
-- ====================================================================

-- 5 Theory + Lab subjects for Semester 2 (COMMON across all branches)
INSERT INTO subjects (subject_id, name, code, type, semester, weekly_lecture_count, weekly_lab_count, total_hours_per_week)
VALUES
  (gen_random_uuid(), 'Mathematics - II', 'MATH-201', 'BOTH', 2, 4, 2, 6),
  (gen_random_uuid(), 'Chemistry', 'CHE-201', 'BOTH', 2, 3, 2, 5),
  (gen_random_uuid(), 'Database Systems', 'CS-201', 'BOTH', 2, 3, 2, 5),
  (gen_random_uuid(), 'Web Technologies', 'CS-202', 'BOTH', 2, 3, 2, 5),
  (gen_random_uuid(), 'Communication Skills', 'ENG-201', 'BOTH', 2, 2, 2, 4);

-- 1 Lab-only subject for Semester 2 (COMMON across all branches)
INSERT INTO subjects (subject_id, name, code, type, semester, weekly_lecture_count, weekly_lab_count, total_hours_per_week)
VALUES
  (gen_random_uuid(), 'Laboratory Techniques', 'LAB-201', 'LAB', 2, 0, 4, 4);

-- ====================================================================
-- PHASE 4: MAP COMMON SEM 1 & 2 SUBJECTS TO ALL 3 BRANCHES
-- ====================================================================

-- Map Semester 1 subjects to all three branches
INSERT INTO subjects_branches (subject_id, branch_id, is_applicable)
SELECT s.subject_id, b.branch_id, true
FROM subjects s
CROSS JOIN branches b
WHERE s.semester = 1;

-- Map Semester 2 subjects to all three branches
INSERT INTO subjects_branches (subject_id, branch_id, is_applicable)
SELECT s.subject_id, b.branch_id, true
FROM subjects s
CROSS JOIN branches b
WHERE s.semester = 2;

-- ====================================================================
-- PHASE 5: ASSIGN PROFESSORS TO SEM 1 & 2 SUBJECTS
-- ====================================================================

-- Create temporary table with unassigned professors
CREATE TEMP TABLE temp_available_profs AS
SELECT ROW_NUMBER() OVER (ORDER BY professor_id) as rn, professor_id
FROM professors
ORDER BY professor_id
LIMIT 12;

-- Assign professors to Semester 1 subjects (6 professors for 6 subjects)
WITH sem1_subjects AS (
  SELECT ROW_NUMBER() OVER (ORDER BY code) as rn, subject_id
  FROM subjects
  WHERE semester = 1
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT t.professor_id, s.subject_id
FROM temp_available_profs t
INNER JOIN sem1_subjects s ON t.rn = s.rn
WHERE t.rn <= 6;

-- Assign professors to Semester 2 subjects (next 6 professors for 6 subjects)
WITH sem2_subjects AS (
  SELECT ROW_NUMBER() OVER (ORDER BY code) as rn, subject_id
  FROM subjects
  WHERE semester = 2
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT t.professor_id, s.subject_id
FROM temp_available_profs t
INNER JOIN sem2_subjects s ON t.rn = (s.rn + 6)
WHERE (s.rn + 6) <= 12;

-- ====================================================================
-- PHASE 6: VERIFICATION
-- ====================================================================

SELECT '=== SEMESTER 1 COMMON SUBJECTS ===' as report;
SELECT 
  b.code as branch,
  s.code as subject_code,
  s.name as subject_name,
  s.type,
  s.weekly_lecture_count as lectures,
  s.weekly_lab_count as labs
FROM subjects s
INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
INNER JOIN branches b ON sb.branch_id = b.branch_id
WHERE s.semester = 1
ORDER BY b.code, s.code;

SELECT '=== SEMESTER 2 COMMON SUBJECTS ===' as report;
SELECT 
  b.code as branch,
  s.code as subject_code,
  s.name as subject_name,
  s.type,
  s.weekly_lecture_count as lectures,
  s.weekly_lab_count as labs
FROM subjects s
INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
INNER JOIN branches b ON sb.branch_id = b.branch_id
WHERE s.semester = 2
ORDER BY b.code, s.code;

SELECT '=== PROFESSOR ASSIGNMENT ===' as report;
SELECT 
  p.name as professor,
  s.code as subject,
  s.name as subject_name,
  s.semester
FROM professors_subjects ps
INNER JOIN professors p ON ps.professor_id = p.professor_id
INNER JOIN subjects s ON ps.subject_id = s.subject_id
WHERE s.semester IN (1, 2)
ORDER BY s.semester, s.code;

SELECT '=== SUMMARY ===' as report;
SELECT 
  'Semester 1 Subjects' as metric,
  COUNT(*) as count
FROM subjects WHERE semester = 1
UNION ALL
SELECT 
  'Semester 2 Subjects',
  COUNT(*)
FROM subjects WHERE semester = 2
UNION ALL
SELECT 
  'Sem 1 Branch Mappings (6 subj × 3 branches)',
  COUNT(*)
FROM subjects_branches 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester = 1)
UNION ALL
SELECT 
  'Sem 2 Branch Mappings (6 subj × 3 branches)',
  COUNT(*)
FROM subjects_branches 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester = 2)
UNION ALL
SELECT 
  'Professors Assigned to Sem 1 & 2',
  COUNT(DISTINCT professor_id)
FROM professors_subjects 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

SELECT '✅ COMMON SEMESTERS UPDATE COMPLETE' as status;
