-- Verify Semester 1 & 2 are common across all branches
SELECT '=== SEMESTER 1 & 2 CONSISTENCY VERIFICATION ===' as section;

SELECT 
  s.semester,
  s.code,
  s.type,
  COUNT(DISTINCT sb.branch_id) as branches_mapped
FROM subjects s
LEFT JOIN subjects_branches sb ON s.subject_id = sb.subject_id
WHERE s.semester IN (1, 2)
GROUP BY s.semester, s.code, s.type
ORDER BY s.semester, s.code;

-- Should show exactly 3 branches for each subject
SELECT '=== PROFESSOR LOAD DISTRIBUTION ===' as section;
SELECT 
  'Total Professors Used for Sem 1 & 2' as metric,
  COUNT(DISTINCT professor_id) as value
FROM professors_subjects 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

SELECT 'Max Subjects per Professor' as metric,
  MAX(subj_count) as value
FROM (
  SELECT professor_id, COUNT(*) as subj_count
  FROM professors_subjects ps
  WHERE ps.subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2))
  GROUP BY professor_id
) agg;

SELECT 'Min Subjects per Professor' as metric,
  MIN(subj_count) as value
FROM (
  SELECT professor_id, COUNT(*) as subj_count
  FROM professors_subjects ps
  WHERE ps.subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2))
  GROUP BY professor_id
) agg;

-- Verify Semester 3-8 are unchanged
SELECT '=== SEMESTER 3-8 DATA CHECK (Should be Unchanged) ===' as section;
SELECT 
  s.semester,
  COUNT(DISTINCT s.subject_id) as total_subjects,
  COUNT(DISTINCT sb.branch_id) as branches_affected
FROM subjects s
LEFT JOIN subjects_branches sb ON s.subject_id = sb.subject_id
WHERE s.semester IN (3, 4, 5, 6, 7, 8)
GROUP BY s.semester
ORDER BY s.semester;

SELECT '✅ VERIFICATION COMPLETE' as status;
