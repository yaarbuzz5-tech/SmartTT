-- ============================================================================
-- COMPLETE DATA CLEANUP AND GENERATION FOR PostgreSQL
-- Delete all existing data and generate comprehensive dummy academic data
-- For: Computer Engineering, IoT, Artificial Intelligence
-- Semesters: 1-8 with full subject-professor mapping
-- ============================================================================

-- PHASE 1: DELETE ALL EXISTING DATA (CASCADE)
-- ============================================================================

DELETE FROM professors_subjects;
DELETE FROM subjects_branches;
DELETE FROM timetable;
DELETE FROM subjects;
DELETE FROM professors;
DELETE FROM batches;
DELETE FROM branches;

-- ============================================================================
-- PHASE 2: CREATE BRANCHES
-- ============================================================================

INSERT INTO branches (name, code) VALUES
('Computer Engineering', 'CE'),
('Internet of Things', 'IOT'),
('Artificial Intelligence', 'AI');

-- ============================================================================
-- PHASE 3: CREATE PROFESSORS (25 unique professors, each max 5 subjects)
-- ============================================================================

INSERT INTO professors (name, email, department, phone) VALUES
('Dr. Rajesh Kumar', 'rajesh.kumar@college.edu', 'CS', '9876543210'),
('Dr. Priya Sharma', 'priya.sharma@college.edu', 'CS', '9876543211'),
('Dr. Amit Patel', 'amit.patel@college.edu', 'CS', '9876543212'),
('Dr. Neha Singh', 'neha.singh@college.edu', 'CS', '9876543213'),
('Dr. Vikram Desai', 'vikram.desai@college.edu', 'CS', '9876543214'),
('Dr. Anjali Gupta', 'anjali.gupta@college.edu', 'CS', '9876543215'),
('Dr. Rohan Verma', 'rohan.verma@college.edu', 'CS', '9876543216'),
('Dr. Kavya Nair', 'kavya.nair@college.edu', 'CS', '9876543217'),
('Dr. Sanjay Chopra', 'sanjay.chopra@college.edu', 'EE', '9876543218'),
('Dr. Meera Joshi', 'meera.joshi@college.edu', 'EE', '9876543219'),
('Dr. Harsh Dixit', 'harsh.dixit@college.edu', 'EE', '9876543220'),
('Dr. Ritu Bansal', 'ritu.bansal@college.edu', 'EE', '9876543221'),
('Dr. Anil Kumar', 'anil.kumar@college.edu', 'EE', '9876543222'),
('Dr. Divya Pandey', 'divya.pandey@college.edu', 'EE', '9876543223'),
('Dr. Sameer Malik', 'sameer.malik@college.edu', 'CS', '9876543224'),
('Dr. Nidhi Arora', 'nidhi.arora@college.edu', 'CS', '9876543225'),
('Dr. Akshay Singh', 'akshay.singh@college.edu', 'CS', '9876543226'),
('Dr. Isha Kapoor', 'isha.kapoor@college.edu', 'CS', '9876543227'),
('Dr. Manish Tiwari', 'manish.tiwari@college.edu', 'MATH', '9876543228'),
('Dr. Pooja Saxena', 'pooja.saxena@college.edu', 'MATH', '9876543229'),
('Dr. Suresh Prabhu', 'suresh.prabhu@college.edu', 'PHYS', '9876543230'),
('Dr. Geeta Nair', 'geeta.nair@college.edu', 'PHYS', '9876543231'),
('Dr. Rahul Deshmukh', 'rahul.deshmukh@college.edu', 'MATH', '9876543232'),
('Dr. Sneha Kulkarni', 'sneha.kulkarni@college.edu', 'CS', '9876543233'),
('Dr. Vivek Mishra', 'vivek.mishra@college.edu', 'CS', '9876543234');

-- ============================================================================
-- PHASE 4-6: CREATE ALL SUBJECTS FOR CE, IOT, AND AI (Semesters 1-8)
-- ============================================================================

INSERT INTO subjects (name, code, semester, type, weekly_lecture_count, weekly_lab_count) VALUES
-- CE SEMESTER 1
('Programming Fundamentals', 'CE101', 1, 'BOTH', 3, 2),
('Digital Logic Design', 'CE102', 1, 'BOTH', 3, 2),
('Mathematics - I', 'CE103', 1, 'THEORY', 4, 0),
('Physics', 'CE104', 1, 'BOTH', 3, 2),
('Engineering Graphics', 'CE105', 1, 'BOTH', 2, 3),
('Programming Lab', 'CE106', 1, 'LAB', 0, 4),
-- CE SEMESTER 2
('Object Oriented Programming', 'CE201', 2, 'BOTH', 3, 2),
('Data Structures', 'CE202', 2, 'BOTH', 3, 2),
('Mathematics - II', 'CE203', 2, 'THEORY', 4, 0),
('Chemistry', 'CE204', 2, 'BOTH', 3, 2),
('Web Development Basics', 'CE205', 2, 'BOTH', 2, 3),
('Data Structures Lab', 'CE206', 2, 'LAB', 0, 4),
-- CE SEMESTER 3
('Database Systems', 'CE301', 3, 'BOTH', 3, 2),
('Operating Systems', 'CE302', 3, 'BOTH', 3, 2),
('Discrete Mathematics', 'CE303', 3, 'THEORY', 4, 0),
('Computer Architecture', 'CE304', 3, 'BOTH', 3, 2),
('Web Technologies', 'CE305', 3, 'BOTH', 2, 3),
('Database Lab', 'CE306', 3, 'LAB', 0, 4),
-- CE SEMESTER 4
('Computer Networks', 'CE401', 4, 'BOTH', 3, 2),
('Software Engineering', 'CE402', 4, 'BOTH', 3, 2),
('Algorithms', 'CE403', 4, 'THEORY', 4, 0),
('Mobile Computing', 'CE404', 4, 'BOTH', 2, 3),
('Compiler Design', 'CE405', 4, 'BOTH', 3, 2),
('Networks Lab', 'CE406', 4, 'LAB', 0, 4),
-- CE SEMESTER 5
('Artificial Intelligence Basics', 'CE501', 5, 'BOTH', 3, 2),
('Machine Learning', 'CE502', 5, 'BOTH', 3, 2),
('Cybersecurity', 'CE503', 5, 'THEORY', 3, 0),
('Cloud Computing', 'CE504', 5, 'BOTH', 2, 3),
('Advanced Web Development', 'CE505', 5, 'BOTH', 2, 3),
('AI Lab', 'CE506', 5, 'LAB', 0, 4),
-- CE SEMESTER 6
('Deep Learning', 'CE601', 6, 'BOTH', 3, 2),
('Data Mining', 'CE602', 6, 'BOTH', 3, 2),
('Distributed Systems', 'CE603', 6, 'THEORY', 3, 0),
('Microservices Architecture', 'CE604', 6, 'BOTH', 2, 3),
('Information Security', 'CE605', 6, 'BOTH', 2, 3),
('ML Lab', 'CE606', 6, 'LAB', 0, 4),
-- CE SEMESTER 7
('Project Management', 'CE701', 7, 'BOTH', 2, 3),
('Advanced Algorithms', 'CE702', 7, 'BOTH', 3, 2),
('Blockchain Technology', 'CE703', 7, 'BOTH', 3, 2),
('Ethics in Computing', 'CE704', 7, 'THEORY', 2, 0),
-- CE SEMESTER 8
('Advanced Software Engineering', 'CE801', 8, 'BOTH', 3, 2),
('Capstone Project A', 'CE802', 8, 'BOTH', 2, 4),
('Advanced Machine Learning', 'CE803', 8, 'BOTH', 3, 2),
('Technical Writing', 'CE804', 8, 'THEORY', 2, 0),

-- IOT SEMESTER 1
('C Programming Fundamentals', 'IOT101', 1, 'BOTH', 3, 2),
('Digital Electronics', 'IOT102', 1, 'BOTH', 3, 2),
('Mathematics - I', 'IOT103', 1, 'THEORY', 4, 0),
('Physics for Engineers', 'IOT104', 1, 'BOTH', 3, 2),
('Circuit Analysis', 'IOT105', 1, 'BOTH', 3, 2),
('C Programming Lab', 'IOT106', 1, 'LAB', 0, 4),
-- IOT SEMESTER 2
('Embedded Systems Basics', 'IOT201', 2, 'BOTH', 3, 2),
('Microcontroller Programming', 'IOT202', 2, 'BOTH', 3, 2),
('Mathematics - II', 'IOT203', 2, 'THEORY', 4, 0),
('Applied Physics', 'IOT204', 2, 'BOTH', 3, 2),
('Sensors and Transducers', 'IOT205', 2, 'BOTH', 3, 2),
('Embedded Lab', 'IOT206', 2, 'LAB', 0, 4),
-- IOT SEMESTER 3
('Wireless Communication', 'IOT301', 3, 'BOTH', 3, 2),
('Signal Processing', 'IOT302', 3, 'BOTH', 3, 2),
('Discrete Mathematics', 'IOT303', 3, 'THEORY', 4, 0),
('Control Systems', 'IOT304', 3, 'BOTH', 3, 2),
('IoT Communication Protocols', 'IOT305', 3, 'BOTH', 3, 2),
('Wireless Lab', 'IOT306', 3, 'LAB', 0, 4),
-- IOT SEMESTER 4
('IoT Architectures', 'IOT401', 4, 'BOTH', 3, 2),
('Power Systems for IoT', 'IOT402', 4, 'BOTH', 3, 2),
('Network Programming', 'IOT403', 4, 'THEORY', 3, 0),
('MQTT and CoAP Protocols', 'IOT404', 4, 'BOTH', 2, 3),
('Cloud Platforms for IoT', 'IOT405', 4, 'BOTH', 2, 3),
('IoT Systems Lab', 'IOT406', 4, 'LAB', 0, 4),
-- IOT SEMESTER 5
('Edge Computing', 'IOT501', 5, 'BOTH', 3, 2),
('Data Analytics for IoT', 'IOT502', 5, 'BOTH', 3, 2),
('IoT Security', 'IOT503', 5, 'THEORY', 3, 0),
('Smart City Solutions', 'IOT504', 5, 'BOTH', 2, 3),
('Fog Computing', 'IOT505', 5, 'BOTH', 2, 3),
('Analytics Lab', 'IOT506', 5, 'LAB', 0, 4),
-- IOT SEMESTER 6
('Machine Learning for IoT', 'IOT601', 6, 'BOTH', 3, 2),
('Real-Time Systems', 'IOT602', 6, 'BOTH', 3, 2),
('Industrial IoT', 'IOT603', 6, 'THEORY', 3, 0),
('5G and Beyond', 'IOT604', 6, 'BOTH', 2, 3),
('IoT Middleware', 'IOT605', 6, 'BOTH', 2, 3),
('IIoT Lab', 'IOT606', 6, 'LAB', 0, 4),
-- IOT SEMESTER 7
('Advanced Embedded Systems', 'IOT701', 7, 'BOTH', 3, 2),
('IoT Testing and Deployment', 'IOT702', 7, 'BOTH', 2, 3),
('Smart Devices and Sensors', 'IOT703', 7, 'BOTH', 3, 2),
('IoT Standards and Regulations', 'IOT704', 7, 'THEORY', 2, 0),
-- IOT SEMESTER 8
('Advanced IoT Applications', 'IOT801', 8, 'BOTH', 3, 2),
('Capstone Project B', 'IOT802', 8, 'BOTH', 2, 4),
('Advanced Edge Computing', 'IOT803', 8, 'BOTH', 3, 2),
('IoT Entrepreneurship', 'IOT804', 8, 'THEORY', 2, 0),

-- AI SEMESTER 1
('Python Programming', 'AI101', 1, 'BOTH', 3, 2),
('Discrete Structures', 'AI102', 1, 'BOTH', 3, 2),
('Mathematics - I (Calculus)', 'AI103', 1, 'THEORY', 4, 0),
('Physics for AI Engineers', 'AI104', 1, 'BOTH', 3, 2),
('Computer Organization', 'AI105', 1, 'BOTH', 3, 2),
('Python Lab', 'AI106', 1, 'LAB', 0, 4),
-- AI SEMESTER 2
('Data Structures and Algorithms', 'AI201', 2, 'BOTH', 3, 2),
('Linear Algebra Foundations', 'AI202', 2, 'BOTH', 3, 2),
('Mathematics - II (Statistics)', 'AI203', 2, 'THEORY', 4, 0),
('Applied Physics', 'AI204', 2, 'BOTH', 3, 2),
('Digital Logic and Design', 'AI205', 2, 'BOTH', 3, 2),
('Data Structures Lab', 'AI206', 2, 'LAB', 0, 4),
-- AI SEMESTER 3
('Probability and Statistics', 'AI301', 3, 'BOTH', 3, 2),
('Introduction to Machine Learning', 'AI302', 3, 'BOTH', 3, 2),
('Advanced Mathematics', 'AI303', 3, 'THEORY', 4, 0),
('Database Management Systems', 'AI304', 3, 'BOTH', 3, 2),
('Web Development Basics', 'AI305', 3, 'BOTH', 2, 3),
('ML Lab', 'AI306', 3, 'LAB', 0, 4),
-- AI SEMESTER 4
('Deep Learning Fundamentals', 'AI401', 4, 'BOTH', 3, 2),
('Natural Language Processing', 'AI402', 4, 'BOTH', 3, 2),
('Computer Networks', 'AI403', 4, 'THEORY', 3, 0),
('Computer Vision Basics', 'AI404', 4, 'BOTH', 3, 2),
('Neural Networks Lab', 'AI405', 4, 'BOTH', 2, 3),
('Deep Learning Lab', 'AI406', 4, 'LAB', 0, 4),
-- AI SEMESTER 5
('Reinforcement Learning', 'AI501', 5, 'BOTH', 3, 2),
('Advanced Computer Vision', 'AI502', 5, 'BOTH', 3, 2),
('Advanced NLP', 'AI503', 5, 'THEORY', 3, 0),
('Knowledge Graphs', 'AI504', 5, 'BOTH', 2, 3),
('AI Ethics and Fairness', 'AI505', 5, 'BOTH', 2, 3),
('NLP Lab', 'AI506', 5, 'LAB', 0, 4),
-- AI SEMESTER 6
('Generative AI Models', 'AI601', 6, 'BOTH', 3, 2),
('Time Series Analysis', 'AI602', 6, 'BOTH', 3, 2),
('Recommender Systems', 'AI603', 6, 'THEORY', 3, 0),
('Transfer Learning', 'AI604', 6, 'BOTH', 2, 3),
('ML Operations (MLOps)', 'AI605', 6, 'BOTH', 2, 3),
('Vision Lab', 'AI606', 6, 'LAB', 0, 4),
-- AI SEMESTER 7
('Advanced Generative Models', 'AI701', 7, 'BOTH', 3, 2),
('Quantum Machine Learning', 'AI702', 7, 'BOTH', 3, 2),
('AI for Robotics', 'AI703', 7, 'BOTH', 2, 3),
('AI Regulation and Governance', 'AI704', 7, 'THEORY', 2, 0),
-- AI SEMESTER 8
('Advanced Reinforcement Learning', 'AI801', 8, 'BOTH', 3, 2),
('Capstone Project C', 'AI802', 8, 'BOTH', 2, 4),
('AI for Healthcare', 'AI803', 8, 'BOTH', 3, 2),
('Research Methodology', 'AI804', 8, 'THEORY', 2, 0);

-- ============================================================================
-- PHASE 7: MAP SUBJECTS TO BRANCHES
-- ============================================================================

INSERT INTO subjects_branches (subject_id, branch_id)
SELECT s.subject_id, b.branch_id
FROM subjects s, branches b
WHERE 
  (b.code = 'CE' AND s.code LIKE 'CE%') OR
  (b.code = 'IOT' AND s.code LIKE 'IOT%') OR
  (b.code = 'AI' AND s.code LIKE 'AI%');

-- ============================================================================
-- PHASE 8: MAP PROFESSORS TO SUBJECTS (25 professors, each with max 5 subjects)
-- ============================================================================

INSERT INTO professors_subjects (professor_id, subject_id)
SELECT p.professor_id, s.subject_id FROM professors p, subjects s
WHERE (p.name = 'Dr. Rajesh Kumar' AND s.code IN ('CE202', 'CE403', 'AI201', 'AI202', 'IOT403'))
OR (p.name = 'Dr. Priya Sharma' AND s.code IN ('CE301', 'CE206', 'AI304', 'IOT502', 'IOT602'))
OR (p.name = 'Dr. Amit Patel' AND s.code IN ('CE305', 'CE205', 'CE505', 'AI305', 'IOT405'))
OR (p.name = 'Dr. Neha Singh' AND s.code IN ('CE302', 'CE306', 'AI105', 'IOT201'))
OR (p.name = 'Dr. Vikram Desai' AND s.code IN ('CE401', 'CE406', 'AI403', 'IOT301', 'IOT306'))
OR (p.name = 'Dr. Anjali Gupta' AND s.code IN ('CE405', 'CE603', 'CE702', 'IOT603', 'AI702'))
OR (p.name = 'Dr. Rohan Verma' AND s.code IN ('CE402', 'CE701', 'CE801', 'IOT702', 'AI101'))
OR (p.name = 'Dr. Kavya Nair' AND s.code IN ('CE404', 'CE506', 'IOT701', 'AI106'))
OR (p.name = 'Dr. Sanjay Chopra' AND s.code IN ('IOT201', 'IOT202', 'IOT206', 'CE102', 'AI205'))
OR (p.name = 'Dr. Meera Joshi' AND s.code IN ('IOT301', 'IOT302', 'IOT306', 'IOT604', 'CE101'))
OR (p.name = 'Dr. Harsh Dixit' AND s.code IN ('IOT302', 'IOT303', 'IOT601', 'AI303'))
OR (p.name = 'Dr. Ritu Bansal' AND s.code IN ('IOT402', 'IOT105', 'IOT703', 'CE104', 'IOT104'))
OR (p.name = 'Dr. Anil Kumar' AND s.code IN ('IOT304', 'IOT401', 'IOT501', 'IOT605', 'AI703'))
OR (p.name = 'Dr. Divya Pandey' AND s.code IN ('IOT205', 'IOT703', 'IOT106', 'IOT305'))
OR (p.name = 'Dr. Sameer Malik' AND s.code IN ('CE502', 'CE602', 'AI302', 'IOT601', 'AI501'))
OR (p.name = 'Dr. Nidhi Arora' AND s.code IN ('CE601', 'CE606', 'AI401', 'AI406', 'AI601'))
OR (p.name = 'Dr. Akshay Singh' AND s.code IN ('AI402', 'AI503', 'AI506', 'AI704', 'CE501'))
OR (p.name = 'Dr. Isha Kapoor' AND s.code IN ('AI404', 'AI502', 'AI606', 'AI803', 'CE802'))
OR (p.name = 'Dr. Manish Tiwari' AND s.code IN ('CE103', 'AI103', 'AI202', 'IOT103', 'IOT203'))
OR (p.name = 'Dr. Pooja Saxena' AND s.code IN ('CE203', 'AI203', 'AI301', 'AI602', 'CE503'))
OR (p.name = 'Dr. Suresh Prabhu' AND s.code IN ('CE104', 'IOT104', 'AI104', 'CE204', 'AI204'))
OR (p.name = 'Dr. Geeta Nair' AND s.code IN ('IOT204', 'CE105', 'AI204', 'AI206'))
OR (p.name = 'Dr. Rahul Deshmukh' AND s.code IN ('CE303', 'AI102', 'IOT303', 'AI303', 'CE703'))
OR (p.name = 'Dr. Sneha Kulkarni' AND s.code IN ('CE503', 'CE605', 'IOT503', 'AI505', 'CE504'))
OR (p.name = 'Dr. Vivek Mishra' AND s.code IN ('CE504', 'IOT405', 'IOT505', 'AI605', 'CE604'));

-- ============================================================================
-- PHASE 9: CREATE BATCHES FOR ALL BRANCHES AND SEMESTERS
-- ============================================================================

INSERT INTO batches (branch_id, batch_number, semester)
SELECT b.branch_id, bn.batch_num, s.sem
FROM branches b
CROSS JOIN (SELECT 1 as batch_num UNION ALL SELECT 2) bn
CROSS JOIN (SELECT 1 as sem UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 
            UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8) s;

-- ============================================================================
-- VERIFICATION: Show counts of generated data
-- ============================================================================

SELECT '✅ DATA GENERATION COMPLETE!' as Status;
