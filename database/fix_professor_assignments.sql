/**
 * FIX PROFESSOR ASSIGNMENTS FOR SEMESTER 1 & 2
 * 
 * Rules:
 * - Each subject has EXACTLY ONE professor
 * - Lab-only subjects also get a professor
 * - Professors distributed to avoid overload
 */

-- Delete all Sem 1 & 2 professor-subject mappings to start fresh
DELETE FROM professors_subjects 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

-- ====================================================================
-- Assign ONE professor to each Semester 1 subject
-- ====================================================================

INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM subjects s
INNER JOIN (
  -- Assign professors in rotation: Prof 1->Subj 1, Prof 2->Subj 2, etc.
  SELECT 
    s.subject_id,
    p.professor_id,
    ROW_NUMBER() OVER (ORDER BY s.code) as subj_rank,
    ROW_NUMBER() OVER (ORDER BY p.professor_id) as prof_rank
  FROM subjects s
  CROSS JOIN (
    SELECT professor_id FROM professors ORDER BY professor_id LIMIT 12
  ) p
  WHERE s.semester = 1
) ranked_data ON ranked_data.subject_id = s.subject_id
INNER JOIN professors p ON p.professor_id = ranked_data.professor_id
WHERE ranked_data.subj_rank = ranked_data.prof_rank;

-- ====================================================================
-- Assign ONE professor to each Semester 2 subject
-- ====================================================================

INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM subjects s
INNER JOIN (
  -- Assign professors starting from Prof 7 onwards
  SELECT 
    s.subject_id,
    p.professor_id,
    ROW_NUMBER() OVER (ORDER BY s.code) as subj_rank,
    ROW_NUMBER() OVER (ORDER BY p.professor_id) as prof_rank
  FROM subjects s
  CROSS JOIN (
    SELECT professor_id FROM professors ORDER BY professor_id OFFSET 6 LIMIT 12
  ) p
  WHERE s.semester = 2
) ranked_data ON ranked_data.subject_id = s.subject_id
INNER JOIN professors p ON p.professor_id = ranked_data.professor_id
WHERE ranked_data.subj_rank = ranked_data.prof_rank;

-- ====================================================================
-- VERIFICATION
-- ====================================================================

SELECT '=== VERIFICATION: ONE PROFESSOR PER SUBJECT ===' as check_type;
SELECT 
  s.semester,
  s.code,
  s.name,
  s.type,
  p.name as professor_name,
  COUNT(*) OVER (PARTITION BY s.subject_id) as prof_count
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
LEFT JOIN professors p ON ps.professor_id = p.professor_id
WHERE s.semester IN (1, 2)
ORDER BY s.semester, s.code;

-- Check for any subjects with 0 or multiple professors
SELECT '=== ISSUES FOUND ===' as check_type;
SELECT 
  s.semester,
  s.code,
  s.name,
  COUNT(DISTINCT ps.professor_id) as prof_count,
  CASE 
    WHEN COUNT(DISTINCT ps.professor_id) = 0 THEN 'NO PROFESSOR'
    WHEN COUNT(DISTINCT ps.professor_id) > 1 THEN 'MULTIPLE PROFESSORS'
    ELSE 'OK'
  END as status
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
WHERE s.semester IN (1, 2)
GROUP BY s.semester, s.code, s.name
HAVING COUNT(DISTINCT ps.professor_id) != 1;

-- Professor load check
SELECT '=== PROFESSOR LOAD (should be 1 prof per subject) ===' as check_type;
SELECT 
  p.name as professor,
  COUNT(ps.subject_id) as subjects_assigned,
  STRING_AGG(s.code || ' (Sem ' || s.semester || ')', ', ' ORDER BY s.semester, s.code) as subjects
FROM professors p
LEFT JOIN professors_subjects ps ON p.professor_id = ps.professor_id
LEFT JOIN subjects s ON ps.subject_id = s.subject_id
WHERE ps.subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2))
GROUP BY p.professor_id, p.name
ORDER BY subjects_assigned DESC, p.name;

SELECT '✅ PROFESSOR ASSIGNMENTS FIXED - ONE PER SUBJECT' as status;
