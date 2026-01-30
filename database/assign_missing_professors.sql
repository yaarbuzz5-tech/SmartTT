-- Assign professors to all subjects missing professor assignments
-- Semesters 3-8, all branches

WITH professors_ordered AS (
  SELECT professor_id, ROW_NUMBER() OVER (ORDER BY professor_id) as prof_row
  FROM professors
),
subjects_missing_profs AS (
  SELECT 
    s.subject_id,
    s.semester,
    s.code,
    s.name,
    ROW_NUMBER() OVER (ORDER BY s.semester, s.code) as subj_row
  FROM subjects s
  LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
  WHERE ps.professor_id IS NULL
  GROUP BY s.subject_id, s.semester, s.code, s.name
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT 
  po.professor_id,
  smp.subject_id
FROM subjects_missing_profs smp
JOIN professors_ordered po ON (smp.subj_row - 1) % 25 + 1 = po.prof_row;

-- Verify assignment
SELECT s.semester, s.code, s.name, s.type, p.name as professor
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
LEFT JOIN professors p ON ps.professor_id = p.professor_id
WHERE s.semester >= 3
ORDER BY s.semester, s.code;
