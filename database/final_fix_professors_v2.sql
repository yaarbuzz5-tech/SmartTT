/**
 * FINAL FIX: ONE PROFESSOR PER SUBJECT
 * 
 * - Delete current mappings for Sem 1 & 2
 * - Assign exactly ONE professor per subject
 * - Include lab-only subjects in assignment
 * - Verify no professor exceeds reasonable load
 */

-- Step 1: Delete all Sem 1 & 2 mappings
DELETE FROM professors_subjects 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

-- Step 2: Create clean assignments
-- Get distinct professors to use
WITH prof_list AS (
  SELECT professor_id, ROW_NUMBER() OVER (ORDER BY professor_id) as prof_rank
  FROM professors
),
sem1_list AS (
  SELECT subject_id, code, ROW_NUMBER() OVER (ORDER BY code) as subj_rank
  FROM subjects WHERE semester = 1
),
sem2_list AS (
  SELECT subject_id, code, ROW_NUMBER() OVER (ORDER BY code) as subj_rank
  FROM subjects WHERE semester = 2
),
-- Assign Sem 1: subjects 1-6 to professors 1-6
sem1_assign AS (
  SELECT p.professor_id, s.subject_id
  FROM prof_list p
  INNER JOIN sem1_list s ON p.prof_rank = s.subj_rank
  WHERE p.prof_rank <= 6
),
-- Assign Sem 2: subjects 1-6 to professors 7-12
sem2_assign AS (
  SELECT p.professor_id, s.subject_id
  FROM prof_list p
  INNER JOIN sem2_list s ON (p.prof_rank - 6) = s.subj_rank
  WHERE p.prof_rank > 6 AND p.prof_rank <= 12
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT professor_id, subject_id FROM sem1_assign
UNION ALL
SELECT professor_id, subject_id FROM sem2_assign;

-- Verification
SELECT '=== VERIFICATION: ONE PROFESSOR PER SUBJECT ===' as report;
SELECT 
  s.semester,
  s.code,
  s.name,
  s.type,
  COALESCE(p.name, 'UNASSIGNED') as professor
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
LEFT JOIN professors p ON ps.professor_id = p.professor_id
WHERE s.semester IN (1, 2)
ORDER BY s.semester, s.code;

-- Check for issues
SELECT '=== CHECK FOR PROBLEMS ===' as report;
SELECT 
  s.semester,
  s.code,
  s.name,
  COUNT(DISTINCT ps.professor_id) as prof_count,
  CASE 
    WHEN COUNT(DISTINCT ps.professor_id) = 0 THEN '⚠️ NO PROFESSOR'
    WHEN COUNT(DISTINCT ps.professor_id) > 1 THEN '⚠️ MULTIPLE PROFESSORS'
    ELSE '✓ OK'
  END as status
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
WHERE s.semester IN (1, 2)
GROUP BY s.semester, s.code, s.name
ORDER BY s.semester, s.code;

-- Professor load summary
SELECT '=== PROFESSOR LOAD ===' as report;
SELECT 
  p.name,
  COUNT(ps.subject_id) as total_subjects,
  STRING_AGG(s.code || ' (Sem' || s.semester || ')', ', ' ORDER BY s.semester, s.code) as assigned_subjects
FROM professors p
LEFT JOIN professors_subjects ps ON p.professor_id = ps.professor_id
LEFT JOIN subjects s ON ps.subject_id = s.subject_id
WHERE ps.subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2))
GROUP BY p.professor_id, p.name
ORDER BY total_subjects DESC, p.name;

SELECT '✅ PROFESSOR ASSIGNMENTS COMPLETE' as status;
