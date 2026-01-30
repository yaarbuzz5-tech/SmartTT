-- Clear all Sem 1 & 2 assignments
DELETE FROM professors_subjects 
WHERE subject_id IN (SELECT subject_id FROM subjects WHERE semester IN (1, 2));

-- Get first 6 available professors for 6 Sem 1 subjects
WITH sem1_profs AS (
  SELECT professor_id, ROW_NUMBER() OVER (ORDER BY professor_id) as rank
  FROM professors LIMIT 6
),
sem1_subjects AS (
  SELECT subject_id, ROW_NUMBER() OVER (ORDER BY code) as rank
  FROM subjects WHERE semester = 1
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM sem1_profs p
INNER JOIN sem1_subjects s ON p.rank = s.rank;

-- Get next 6 professors for 6 Sem 2 subjects
WITH sem2_profs AS (
  SELECT professor_id, ROW_NUMBER() OVER (ORDER BY professor_id) as rank
  FROM professors OFFSET 6 LIMIT 6
),
sem2_subjects AS (
  SELECT subject_id, ROW_NUMBER() OVER (ORDER BY code) as rank
  FROM subjects WHERE semester = 2
)
INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id
FROM sem2_profs p
INNER JOIN sem2_subjects s ON p.rank = s.rank;

-- Verify
SELECT 'Semester 1' as sem, s.code, s.name, p.name as professor
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
LEFT JOIN professors p ON ps.professor_id = p.professor_id
WHERE s.semester = 1
ORDER BY s.code;

SELECT 'Semester 2' as sem, s.code, s.name, p.name as professor
FROM subjects s
LEFT JOIN professors_subjects ps ON s.subject_id = ps.subject_id
LEFT JOIN professors p ON ps.professor_id = p.professor_id
WHERE s.semester = 2
ORDER BY s.code;
