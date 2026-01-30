/**
 * UPDATE COMMON SEMESTERS (1 & 2) FOR ALL BRANCHES
 * 
 * Makes Semester 1 and Semester 2 COMMON across all three branches:
 * - Computer Engineering (CE)
 * - Artificial Intelligence (AI)
 * - Internet of Things (IoT)
 */

-- ====================================================================
-- PHASE 1: DELETE EXISTING SEM 1 & 2 DATA
-- ====================================================================

DELETE FROM timetable WHERE semester IN (1, 2);

DELETE FROM professors_subjects 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

DELETE FROM subjects_branches 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

DELETE FROM subjects WHERE semester IN (1, 2);

-- ====================================================================
-- PHASE 2: CREATE COMMON SEMESTER 1 SUBJECTS (6 total)
-- ====================================================================

-- 5 Theory + Lab subjects
INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count)
VALUES 
  ('Mathematics - I', 'MATH-101', 'BOTH', 1, 4, 2),
  ('Physics', 'PHY-101', 'BOTH', 1, 3, 2),
  ('Engineering Graphics', 'ENG-101', 'BOTH', 1, 2, 4),
  ('Programming Fundamentals', 'CS-101', 'BOTH', 1, 3, 2),
  ('Digital Logic Design', 'CS-102', 'BOTH', 1, 3, 2);

-- 1 Lab-only subject
INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count)
VALUES 
  ('Engineering Workshop', 'ENG-102', 'LAB', 1, 0, 4);

-- ====================================================================
-- PHASE 3: CREATE COMMON SEMESTER 2 SUBJECTS (6 total)
-- ====================================================================

-- 5 Theory + Lab subjects
INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count)
VALUES 
  ('Mathematics - II', 'MATH-201', 'BOTH', 2, 4, 2),
  ('Chemistry', 'CHE-201', 'BOTH', 2, 3, 2),
  ('Database Systems', 'CS-201', 'BOTH', 2, 3, 2),
  ('Web Technologies', 'CS-202', 'BOTH', 2, 3, 2),
  ('Communication Skills', 'ENG-201', 'BOTH', 2, 2, 2);

-- 1 Lab-only subject
INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count)
VALUES 
  ('Laboratory Techniques', 'LAB-201', 'LAB', 2, 0, 4);

-- ====================================================================
-- PHASE 4: MAP SEMESTER 1 & 2 SUBJECTS TO ALL 3 BRANCHES
-- ====================================================================

INSERT INTO subjects_branches (subject_id, branch_id, is_applicable)
SELECT s.subject_id, b.branch_id, true
FROM subjects s
CROSS JOIN branches b
WHERE s.semester IN (1, 2);

-- ====================================================================
-- PHASE 5: ASSIGN PROFESSORS TO SEM 1 & 2 SUBJECTS
-- ====================================================================

-- Get professors 1-6 for Sem 1 subjects
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM (
  SELECT professor_id FROM professors ORDER BY professor_id LIMIT 6
) p
CROSS JOIN (
  SELECT subject_id FROM subjects WHERE semester = 1 ORDER BY code
) s;

-- Get professors 7-12 for Sem 2 subjects  
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM (
  SELECT professor_id FROM professors ORDER BY professor_id OFFSET 6 LIMIT 6
) p
CROSS JOIN (
  SELECT subject_id FROM subjects WHERE semester = 2 ORDER BY code
) s;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

SELECT '=== SEMESTER 1 SUBJECTS (COMMON TO ALL BRANCHES) ===' as report;
SELECT 
  b.code as branch,
  s.code as subject_code,
  s.name,
  s.type,
  CONCAT(s.weekly_lecture_count, '+', s.weekly_lab_count) as hours
FROM subjects s
INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
INNER JOIN branches b ON sb.branch_id = b.branch_id
WHERE s.semester = 1
ORDER BY b.code, s.code;

SELECT '=== SEMESTER 2 SUBJECTS (COMMON TO ALL BRANCHES) ===' as report;
SELECT 
  b.code as branch,
  s.code as subject_code,
  s.name,
  s.type,
  CONCAT(s.weekly_lecture_count, '+', s.weekly_lab_count) as hours
FROM subjects s
INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
INNER JOIN branches b ON sb.branch_id = b.branch_id
WHERE s.semester = 2
ORDER BY b.code, s.code;

SELECT '=== PROFESSOR ASSIGNMENTS ===' as report;
SELECT 
  p.name,
  COUNT(ps.subject_id) as num_subjects,
  STRING_AGG(s.code, ', ' ORDER BY s.semester, s.code) as subjects_assigned
FROM professors_subjects ps
INNER JOIN professors p ON ps.professor_id = p.professor_id
INNER JOIN subjects s ON ps.subject_id = s.subject_id
WHERE s.semester IN (1, 2)
GROUP BY ps.professor_id, p.name
ORDER BY p.name;

SELECT '=== DATA SUMMARY ===' as report;
SELECT 'Semester 1 Subjects' as metric, COUNT(*) as count FROM subjects WHERE semester = 1
UNION ALL
SELECT 'Semester 2 Subjects', COUNT(*) FROM subjects WHERE semester = 2
UNION ALL
SELECT 'Sem 1 & 2 Subject-Branch Mappings', COUNT(*) FROM subjects_branches WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1,2))
UNION ALL
SELECT 'Sem 1 & 2 Professor-Subject Mappings', COUNT(*) FROM professors_subjects WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1,2));

SELECT '✅ COMMON SEMESTERS UPDATE COMPLETE' as status;
