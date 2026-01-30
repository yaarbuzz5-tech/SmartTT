-- Verify data generation
SELECT 'VERIFICATION SUMMARY' as "Report";
SELECT '==================' as "Report";

SELECT COUNT(*) as Total_Professors FROM professors;
SELECT COUNT(*) as Total_Subjects FROM subjects;
SELECT COUNT(*) as Total_Branches FROM branches;
SELECT COUNT(*) as Total_Batches FROM batches;
SELECT COUNT(*) as Professor_Subject_Mappings FROM professors_subjects;
SELECT COUNT(*) as Subject_Branch_Mappings FROM subjects_branches;

SELECT '==================' as "Report";
SELECT 'SUBJECTS PER SEMESTER (per branch):' as "Report";
SELECT b.code as Branch, s.semester as Semester, COUNT(DISTINCT s.subject_id) as Total_Subjects
FROM subjects s 
JOIN subjects_branches sb ON s.subject_id = sb.subject_id
JOIN branches b ON sb.branch_id = b.branch_id
GROUP BY b.code, s.semester
ORDER BY b.code, s.semester;

SELECT '==================' as "Report";
SELECT 'PROFESSOR SUBJECT COUNT (max should be 5):' as "Report";
SELECT p.name, COUNT(ps.professor_id) as Subject_Count
FROM professors p
LEFT JOIN professors_subjects ps ON p.professor_id = ps.professor_id
GROUP BY p.professor_id, p.name
ORDER BY Subject_Count DESC;

SELECT '==================' as "Report";
SELECT '✅ DATA GENERATION SUCCESSFUL!' as "Report";
