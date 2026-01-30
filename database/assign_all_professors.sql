-- Clean up and assign professors to all subjects properly
-- Delete all professor assignments first
DELETE FROM professors_subjects;

-- Assign professors using round-robin distribution
-- Each professor gets multiple subjects, distributed evenly
WITH professors_numbered AS (
  SELECT 
    professor_id,
    name,
    ROW_NUMBER() OVER (ORDER BY professor_id) as prof_num
  FROM professors
),
subjects_numbered AS (
  SELECT 
    subject_id,
    semester,
    code,
    name,
    type,
    ROW_NUMBER() OVER (ORDER BY semester, code) as subj_num
  FROM subjects
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT 
  pn.professor_id,
  sn.subject_id
FROM subjects_numbered sn
JOIN professors_numbered pn ON 
  ((sn.subj_num - 1) % 25) + 1 = pn.prof_num;

-- Verify all subjects now have professors
SELECT 
  s.semester,
  COUNT(DISTINCT s.subject_id) as total_subjects,
  COUNT(DISTINCT ps.professor_id) as assigned_professors,
  COUNT(DISTINCT CASE WHEN ps.professor_id IS NULL THEN 1 END) as missing_professors
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
GROUP BY s.semester
ORDER BY s.semester;

-- Show detailed assignment
SELECT 
  s.semester,
  s.code,
  s.name,
  COUNT(DISTINCT ps.professor_id) as prof_count,
  STRING_AGG(DISTINCT p.name, ', ') as professors
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
LEFT JOIN professors p ON ps.professor_id = p.professor_id
GROUP BY s.subject_id, s.semester, s.code, s.name
ORDER BY s.semester, s.code;
