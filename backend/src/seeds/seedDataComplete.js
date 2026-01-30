#!/usr/bin/env node

/**
 * SmartTT Comprehensive Academic Data Seeder
 * 
 * Generates complete 8-semester curriculum for:
 * - Computer Engineering
 * - Artificial Intelligence & Machine Learning (AIML)
 * - Internet of Things (IoT)
 * 
 * Rules:
 * - Sem 1-2: Common subjects across all 3 branches
 * - Sem 3-8: Branch-specific subjects
 * - Max 35 unique professors
 * - Each professor: max 5 subjects
 * - Each subject: exactly 1 professor
 */

process.env.DB_HOST = 'dpg-d5uftbp4tr6s73enb1lg-a.virginia-postgres.render.com';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'smarttt_db';
process.env.DB_USER = 'smarttt_db_user';
process.env.DB_PASSWORD = 'A3vjyDGRmwCAeVJpvXIJLhfafKc1ssXu';
process.env.NODE_ENV = 'production';

const pool = require('../config/db');

// ==================== PROFESSOR LIST ====================
const PROFESSORS = [
  // Core/Common Professors (Sem 1-2) - 8 professors
  { name: 'Dr. Rajesh Kumar', dept: 'Computer Engineering', email: 'rajesh.kumar@college.edu' },
  { name: 'Prof. Anjali Singh', dept: 'Computer Engineering', email: 'anjali.singh@college.edu' },
  { name: 'Dr. Priya Verma', dept: 'Electronics', email: 'priya.verma@college.edu' },
  { name: 'Prof. Amit Sharma', dept: 'Electronics', email: 'amit.sharma@college.edu' },
  { name: 'Dr. Neha Gupta', dept: 'Mathematics', email: 'neha.gupta@college.edu' },
  { name: 'Prof. Vikas Patel', dept: 'Physics', email: 'vikas.patel@college.edu' },
  { name: 'Dr. Sneha Desai', dept: 'Chemistry', email: 'sneha.desai@college.edu' },
  { name: 'Prof. Rohan Mehta', dept: 'Engineering', email: 'rohan.mehta@college.edu' },
  
  // Computer Engineering Professors (Sem 3+) - 9 professors
  { name: 'Dr. Suresh Reddy', dept: 'Computer Engineering', email: 'suresh.reddy@college.edu' },
  { name: 'Prof. Deepak Singh', dept: 'Computer Engineering', email: 'deepak.singh@college.edu' },
  { name: 'Dr. Ananya Bhatt', dept: 'Computer Engineering', email: 'ananya.bhatt@college.edu' },
  { name: 'Prof. Karthik Nair', dept: 'Computer Engineering', email: 'karthik.nair@college.edu' },
  { name: 'Dr. Meera Joshi', dept: 'Computer Engineering', email: 'meera.joshi@college.edu' },
  { name: 'Prof. Arun Kumar', dept: 'Computer Engineering', email: 'arun.kumar@college.edu' },
  { name: 'Dr. Sneha Sharma', dept: 'Computer Engineering', email: 'sneha.sharma@college.edu' },
  { name: 'Prof. Vikram Singh', dept: 'Computer Engineering', email: 'vikram.singh@college.edu' },
  { name: 'Dr. Pradeep Kumar', dept: 'Computer Engineering', email: 'pradeep.kumar@college.edu' },
  
  // AIML Professors (Sem 3+) - 9 professors
  { name: 'Dr. Ravi Kumar', dept: 'Artificial Intelligence', email: 'ravi.kumar@college.edu' },
  { name: 'Prof. Divya Sharma', dept: 'Artificial Intelligence', email: 'divya.sharma@college.edu' },
  { name: 'Dr. Ashok Patel', dept: 'Artificial Intelligence', email: 'ashok.patel@college.edu' },
  { name: 'Prof. Nisha Desai', dept: 'Artificial Intelligence', email: 'nisha.desai@college.edu' },
  { name: 'Dr. Sanjay Gupta', dept: 'Artificial Intelligence', email: 'sanjay.gupta@college.edu' },
  { name: 'Prof. Pooja Singh', dept: 'Artificial Intelligence', email: 'pooja.singh@college.edu' },
  { name: 'Dr. Rajiv Nair', dept: 'Artificial Intelligence', email: 'rajiv.nair@college.edu' },
  { name: 'Prof. Anjali Sharma', dept: 'Artificial Intelligence', email: 'anjali.sharma2@college.edu' },
  { name: 'Dr. Sunil Kumar', dept: 'Artificial Intelligence', email: 'sunil.kumar@college.edu' },
  
  // IoT Professors (Sem 3+) - 9 professors
  { name: 'Dr. Arjun Verma', dept: 'Internet of Things', email: 'arjun.verma@college.edu' },
  { name: 'Prof. Shruti Desai', dept: 'Internet of Things', email: 'shruti.desai@college.edu' },
  { name: 'Dr. Naveen Patel', dept: 'Internet of Things', email: 'naveen.patel@college.edu' },
  { name: 'Prof. Swati Kumar', dept: 'Internet of Things', email: 'swati.kumar@college.edu' },
  { name: 'Dr. Abhishek Singh', dept: 'Internet of Things', email: 'abhishek.singh@college.edu' },
  { name: 'Prof. Ritika Sharma', dept: 'Internet of Things', email: 'ritika.sharma@college.edu' },
  { name: 'Dr. Vikrant Kumar', dept: 'Internet of Things', email: 'vikrant.kumar@college.edu' },
  { name: 'Prof. Priya Desai', dept: 'Internet of Things', email: 'priya.desai2@college.edu' },
  { name: 'Dr. Harsh Verma', dept: 'Internet of Things', email: 'harsh.verma@college.edu' },
];

// ==================== SEMESTER 1-2 (COMMON FOR ALL BRANCHES) ====================
const COMMON_SUBJECTS = [
  // Semester 1
  { semester: 1, name: 'Mathematics - I (Calculus)', code: 'MATH101', type: 'BOTH', lectures: 4, labs: 2, profIndex: 4 },
  { semester: 1, name: 'Physics - I', code: 'PHYS101', type: 'BOTH', lectures: 3, labs: 2, profIndex: 5 },
  { semester: 1, name: 'Chemistry - I', code: 'CHEM101', type: 'BOTH', lectures: 3, labs: 2, profIndex: 6 },
  { semester: 1, name: 'Programming in C', code: 'PROG101', type: 'BOTH', lectures: 3, labs: 2, profIndex: 0 },
  { semester: 1, name: 'Engineering Graphics', code: 'ENG101', type: 'BOTH', lectures: 2, labs: 3, profIndex: 7 },
  { semester: 1, name: 'Engineering Workshop', code: 'WORK101', type: 'LAB', lectures: 0, labs: 3, profIndex: 1 },
  
  // Semester 2
  { semester: 2, name: 'Mathematics - II (Linear Algebra)', code: 'MATH201', type: 'BOTH', lectures: 4, labs: 2, profIndex: 4 },
  { semester: 2, name: 'Physics - II (Optics)', code: 'PHYS201', type: 'BOTH', lectures: 3, labs: 2, profIndex: 5 },
  { semester: 2, name: 'Chemistry - II', code: 'CHEM201', type: 'BOTH', lectures: 3, labs: 2, profIndex: 6 },
  { semester: 2, name: 'Data Structures', code: 'CS201', type: 'BOTH', lectures: 3, labs: 2, profIndex: 1 },
  { semester: 2, name: 'Digital Logic Design', code: 'ECE201', type: 'BOTH', lectures: 3, labs: 2, profIndex: 2 },
  { semester: 2, name: 'Basic Electrical Engineering', code: 'EE201', type: 'LAB', lectures: 0, labs: 3, profIndex: 3 },
];

// ==================== COMPUTER ENGINEERING SUBJECTS ====================
const CE_SUBJECTS = [
  // Semester 3
  { semester: 3, name: 'Database Management Systems', code: 'CS301', type: 'BOTH', lectures: 3, labs: 2, profIndex: 8 },
  { semester: 3, name: 'Operating Systems', code: 'CS302', type: 'BOTH', lectures: 3, labs: 2, profIndex: 9 },
  { semester: 3, name: 'Computer Networks', code: 'CS303', type: 'BOTH', lectures: 3, labs: 2, profIndex: 10 },
  { semester: 3, name: 'Web Development Basics', code: 'CS304', type: 'BOTH', lectures: 3, labs: 2, profIndex: 11 },
  { semester: 3, name: 'Software Engineering Fundamentals', code: 'CS305', type: 'BOTH', lectures: 3, labs: 2, profIndex: 12 },
  { semester: 3, name: 'Microprocessors & Assembly Language', code: 'CS306', type: 'LAB', lectures: 0, labs: 3, profIndex: 13 },
  
  // Semester 4
  { semester: 4, name: 'Advanced Databases', code: 'CS401', type: 'BOTH', lectures: 3, labs: 2, profIndex: 8 },
  { semester: 4, name: 'Computer Architecture', code: 'CS402', type: 'BOTH', lectures: 3, labs: 2, profIndex: 14 },
  { semester: 4, name: 'Advanced Networking', code: 'CS403', type: 'BOTH', lectures: 3, labs: 2, profIndex: 10 },
  { semester: 4, name: 'Compiler Design', code: 'CS404', type: 'BOTH', lectures: 3, labs: 2, profIndex: 15 },
  { semester: 4, name: 'Web Technologies (Full Stack)', code: 'CS405', type: 'BOTH', lectures: 3, labs: 2, profIndex: 11 },
  { semester: 4, name: 'Network Security Lab', code: 'CS406', type: 'LAB', lectures: 0, labs: 3, profIndex: 9 },
  
  // Semester 5
  { semester: 5, name: 'Cryptography & Information Security', code: 'CS501', type: 'BOTH', lectures: 3, labs: 2, profIndex: 12 },
  { semester: 5, name: 'Distributed Computing', code: 'CS502', type: 'BOTH', lectures: 3, labs: 2, profIndex: 14 },
  { semester: 5, name: 'Cloud Computing', code: 'CS503', type: 'BOTH', lectures: 3, labs: 2, profIndex: 15 },
  { semester: 5, name: 'Mobile Application Development', code: 'CS504', type: 'BOTH', lectures: 3, labs: 2, profIndex: 16 },
  { semester: 5, name: 'Software Testing & QA', code: 'CS505', type: 'BOTH', lectures: 3, labs: 2, profIndex: 13 },
  { semester: 5, name: 'Advanced Programming Lab', code: 'CS506', type: 'LAB', lectures: 0, labs: 3, profIndex: 16 },
  
  // Semester 6
  { semester: 6, name: 'Parallel Computing', code: 'CS601', type: 'BOTH', lectures: 3, labs: 2, profIndex: 14 },
  { semester: 6, name: 'Big Data Analytics', code: 'CS602', type: 'BOTH', lectures: 3, labs: 2, profIndex: 12 },
  { semester: 6, name: 'Advanced Web Development', code: 'CS603', type: 'BOTH', lectures: 3, labs: 2, profIndex: 11 },
  { semester: 6, name: 'Machine Learning Basics', code: 'CS604', type: 'BOTH', lectures: 3, labs: 2, profIndex: 15 },
  { semester: 6, name: 'DevOps & Containerization', code: 'CS605', type: 'BOTH', lectures: 3, labs: 2, profIndex: 9 },
  { semester: 6, name: 'Database Administration Lab', code: 'CS606', type: 'LAB', lectures: 0, labs: 3, profIndex: 8 },
  
  // Semester 7
  { semester: 7, name: 'Advanced Machine Learning', code: 'CS701', type: 'BOTH', lectures: 3, labs: 2, profIndex: 13 },
  { semester: 7, name: 'Internet of Things', code: 'CS702', type: 'BOTH', lectures: 3, labs: 2, profIndex: 10 },
  { semester: 7, name: 'Blockchain Technology', code: 'CS703', type: 'THEORY', lectures: 3, labs: 0, profIndex: 16 },
  { semester: 7, name: 'Enterprise Software Development', code: 'CS704', type: 'BOTH', lectures: 3, labs: 2, profIndex: 15 },
  
  // Semester 8
  { semester: 8, name: 'Project & Seminar - I', code: 'CS801', type: 'BOTH', lectures: 2, labs: 2, profIndex: 14 },
  { semester: 8, name: 'Project & Seminar - II', code: 'CS802', type: 'BOTH', lectures: 2, labs: 2, profIndex: 12 },
  { semester: 8, name: 'Final Year Capstone Project', code: 'CS803', type: 'THEORY', lectures: 2, labs: 0, profIndex: 8 },
  { semester: 8, name: 'Professional Ethics & Practices', code: 'CS804', type: 'THEORY', lectures: 2, labs: 0, profIndex: 11 },
];

// ==================== AIML SUBJECTS ====================
const AIML_SUBJECTS = [
  // Semester 3
  { semester: 3, name: 'Linear Algebra & Statistics', code: 'AI301', type: 'BOTH', lectures: 4, labs: 2, profIndex: 17 },
  { semester: 3, name: 'Introduction to Machine Learning', code: 'AI302', type: 'BOTH', lectures: 3, labs: 2, profIndex: 18 },
  { semester: 3, name: 'Python for Data Science', code: 'AI303', type: 'BOTH', lectures: 3, labs: 2, profIndex: 19 },
  { semester: 3, name: 'Database Management for AI', code: 'AI304', type: 'BOTH', lectures: 3, labs: 2, profIndex: 20 },
  { semester: 3, name: 'Fundamentals of Neural Networks', code: 'AI305', type: 'BOTH', lectures: 3, labs: 2, profIndex: 21 },
  { semester: 3, name: 'AI & ML Lab', code: 'AI306', type: 'LAB', lectures: 0, labs: 3, profIndex: 22 },
  
  // Semester 4
  { semester: 4, name: 'Deep Learning Fundamentals', code: 'AI401', type: 'BOTH', lectures: 3, labs: 2, profIndex: 18 },
  { semester: 4, name: 'Natural Language Processing Basics', code: 'AI402', type: 'BOTH', lectures: 3, labs: 2, profIndex: 23 },
  { semester: 4, name: 'Computer Vision Fundamentals', code: 'AI403', type: 'BOTH', lectures: 3, labs: 2, profIndex: 21 },
  { semester: 4, name: 'Reinforcement Learning', code: 'AI404', type: 'BOTH', lectures: 3, labs: 2, profIndex: 24 },
  { semester: 4, name: 'Advanced Python Programming', code: 'AI405', type: 'BOTH', lectures: 3, labs: 2, profIndex: 19 },
  { semester: 4, name: 'Deep Learning Lab', code: 'AI406', type: 'LAB', lectures: 0, labs: 3, profIndex: 22 },
  
  // Semester 5
  { semester: 5, name: 'Advanced NLP', code: 'AI501', type: 'BOTH', lectures: 3, labs: 2, profIndex: 23 },
  { semester: 5, name: 'Advanced Computer Vision', code: 'AI502', type: 'BOTH', lectures: 3, labs: 2, profIndex: 21 },
  { semester: 5, name: 'Generative Models & GANs', code: 'AI503', type: 'BOTH', lectures: 3, labs: 2, profIndex: 24 },
  { semester: 5, name: 'Big Data & Spark', code: 'AI504', type: 'BOTH', lectures: 3, labs: 2, profIndex: 17 },
  { semester: 5, name: 'AI Ethics & Responsible AI', code: 'AI505', type: 'BOTH', lectures: 3, labs: 2, profIndex: 20 },
  { semester: 5, name: 'Advanced ML Lab', code: 'AI506', type: 'LAB', lectures: 0, labs: 3, profIndex: 25 },
  
  // Semester 6
  { semester: 6, name: 'Time Series Forecasting', code: 'AI601', type: 'BOTH', lectures: 3, labs: 2, profIndex: 17 },
  { semester: 6, name: 'Transformer Models', code: 'AI602', type: 'BOTH', lectures: 3, labs: 2, profIndex: 23 },
  { semester: 6, name: 'Anomaly Detection & Outliers', code: 'AI603', type: 'BOTH', lectures: 3, labs: 2, profIndex: 24 },
  { semester: 6, name: 'Federated Learning', code: 'AI604', type: 'BOTH', lectures: 3, labs: 2, profIndex: 19 },
  { semester: 6, name: 'MLOps & Model Deployment', code: 'AI605', type: 'BOTH', lectures: 3, labs: 2, profIndex: 18 },
  { semester: 6, name: 'NLP & Vision Lab', code: 'AI606', type: 'LAB', lectures: 0, labs: 3, profIndex: 25 },
  
  // Semester 7
  { semester: 7, name: 'Advanced Reinforcement Learning', code: 'AI701', type: 'BOTH', lectures: 3, labs: 2, profIndex: 21 },
  { semester: 7, name: 'Quantum Machine Learning', code: 'AI702', type: 'BOTH', lectures: 3, labs: 2, profIndex: 22 },
  { semester: 7, name: 'AI for Healthcare', code: 'AI703', type: 'THEORY', lectures: 3, labs: 0, profIndex: 20 },
  { semester: 7, name: 'Research Seminar in AI', code: 'AI704', type: 'BOTH', lectures: 2, labs: 2, profIndex: 23 },
  
  // Semester 8
  { semester: 8, name: 'Capstone Project - AI', code: 'AI801', type: 'BOTH', lectures: 2, labs: 2, profIndex: 24 },
  { semester: 8, name: 'Research Paper Review & Seminar', code: 'AI802', type: 'BOTH', lectures: 2, labs: 2, profIndex: 18 },
  { semester: 8, name: 'Final Project Defense', code: 'AI803', type: 'THEORY', lectures: 2, labs: 0, profIndex: 17 },
  { semester: 8, name: 'Professional Development in AI', code: 'AI804', type: 'THEORY', lectures: 2, labs: 0, profIndex: 25 },
];

// ==================== IOT SUBJECTS ====================
const IOT_SUBJECTS = [
  // Semester 3
  { semester: 3, name: 'Embedded Systems Design', code: 'IOT301', type: 'BOTH', lectures: 3, labs: 2, profIndex: 26 },
  { semester: 3, name: 'IoT Protocols & Standards', code: 'IOT302', type: 'BOTH', lectures: 3, labs: 2, profIndex: 27 },
  { semester: 3, name: 'Microcontroller Programming', code: 'IOT303', type: 'BOTH', lectures: 3, labs: 2, profIndex: 28 },
  { semester: 3, name: 'Wireless Sensor Networks', code: 'IOT304', type: 'BOTH', lectures: 3, labs: 2, profIndex: 29 },
  { semester: 3, name: 'IoT Hardware Fundamentals', code: 'IOT305', type: 'BOTH', lectures: 3, labs: 2, profIndex: 30 },
  { semester: 3, name: 'IoT Lab', code: 'IOT306', type: 'LAB', lectures: 0, labs: 3, profIndex: 31 },
  
  // Semester 4
  { semester: 4, name: 'Advanced Microcontrollers', code: 'IOT401', type: 'BOTH', lectures: 3, labs: 2, profIndex: 28 },
  { semester: 4, name: 'IoT Applications & Services', code: 'IOT402', type: 'BOTH', lectures: 3, labs: 2, profIndex: 27 },
  { semester: 4, name: 'Edge Computing', code: 'IOT403', type: 'BOTH', lectures: 3, labs: 2, profIndex: 26 },
  { semester: 4, name: 'Real-Time Operating Systems', code: 'IOT404', type: 'BOTH', lectures: 3, labs: 2, profIndex: 29 },
  { semester: 4, name: 'IoT Cloud Platforms', code: 'IOT405', type: 'BOTH', lectures: 3, labs: 2, profIndex: 30 },
  { semester: 4, name: 'Advanced IoT Lab', code: 'IOT406', type: 'LAB', lectures: 0, labs: 3, profIndex: 32 },
  
  // Semester 5
  { semester: 5, name: 'IoT Security & Privacy', code: 'IOT501', type: 'BOTH', lectures: 3, labs: 2, profIndex: 33 },
  { semester: 5, name: 'Machine Learning for IoT', code: 'IOT502', type: 'BOTH', lectures: 3, labs: 2, profIndex: 27 },
  { semester: 5, name: 'Smart Home Systems', code: 'IOT503', type: 'BOTH', lectures: 3, labs: 2, profIndex: 28 },
  { semester: 5, name: 'Industrial IoT (IIoT)', code: 'IOT504', type: 'BOTH', lectures: 3, labs: 2, profIndex: 26 },
  { semester: 5, name: 'Data Analytics for IoT', code: 'IOT505', type: 'BOTH', lectures: 3, labs: 2, profIndex: 31 },
  { semester: 5, name: 'IoT Systems Lab', code: 'IOT506', type: 'LAB', lectures: 0, labs: 3, profIndex: 34 },
  
  // Semester 6
  { semester: 6, name: 'Advanced IoT Architectures', code: 'IOT601', type: 'BOTH', lectures: 3, labs: 2, profIndex: 29 },
  { semester: 6, name: 'Blockchain for IoT', code: 'IOT602', type: 'BOTH', lectures: 3, labs: 2, profIndex: 30 },
  { semester: 6, name: 'Autonomous Systems & Robotics', code: 'IOT603', type: 'BOTH', lectures: 3, labs: 2, profIndex: 32 },
  { semester: 6, name: 'IoT Network Management', code: 'IOT604', type: 'BOTH', lectures: 3, labs: 2, profIndex: 26 },
  { semester: 6, name: '5G & Next-Gen Networks for IoT', code: 'IOT605', type: 'BOTH', lectures: 3, labs: 2, profIndex: 33 },
  { semester: 6, name: 'IoT Design Lab', code: 'IOT606', type: 'LAB', lectures: 0, labs: 3, profIndex: 34 },
  
  // Semester 7
  { semester: 7, name: 'AI/ML Integration in IoT', code: 'IOT701', type: 'BOTH', lectures: 3, labs: 2, profIndex: 31 },
  { semester: 7, name: 'Smart City Technologies', code: 'IOT702', type: 'BOTH', lectures: 3, labs: 2, profIndex: 28 },
  { semester: 7, name: 'IoT Entrepreneurship', code: 'IOT703', type: 'THEORY', lectures: 3, labs: 0, profIndex: 27 },
  { semester: 7, name: 'Research in IoT', code: 'IOT704', type: 'BOTH', lectures: 2, labs: 2, profIndex: 32 },
  
  // Semester 8
  { semester: 8, name: 'Capstone Project - IoT', code: 'IOT801', type: 'BOTH', lectures: 2, labs: 2, profIndex: 33 },
  { semester: 8, name: 'IoT System Integration Project', code: 'IOT802', type: 'BOTH', lectures: 2, labs: 2, profIndex: 26 },
  { semester: 8, name: 'Final Project Presentation', code: 'IOT803', type: 'THEORY', lectures: 2, labs: 0, profIndex: 30 },
  { semester: 8, name: 'Professional Standards in IoT', code: 'IOT804', type: 'THEORY', lectures: 2, labs: 0, profIndex: 29 },
];

// ==================== MAIN SEEDING FUNCTION ====================
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting comprehensive academic data seeding...\n');

    // Step 1: Delete all existing data
    console.log('🗑️  Clearing existing data...');
    await pool.query('DELETE FROM timetable CASCADE');
    await pool.query('DELETE FROM assignments CASCADE');
    await pool.query('DELETE FROM student_feedback CASCADE');
    await pool.query('DELETE FROM professors_subjects CASCADE');
    await pool.query('DELETE FROM subjects_branches CASCADE');
    await pool.query('DELETE FROM batches CASCADE');
    await pool.query('DELETE FROM subjects CASCADE');
    await pool.query('DELETE FROM professors CASCADE');
    await pool.query('DELETE FROM branches CASCADE');
    console.log('✅ All data cleared\n');

    // Step 2: Insert Branches (Only 3)
    console.log('📚 Creating branches...');
    const branches = [
      { name: 'Computer Engineering', code: 'CE' },
      { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
      { name: 'Internet of Things', code: 'IOT' },
    ];

    const branchIds = {};
    for (const branch of branches) {
      const result = await pool.query(
        `INSERT INTO branches (name, code) VALUES ($1, $2) RETURNING branch_id`,
        [branch.name, branch.code]
      );
      branchIds[branch.code] = result.rows[0].branch_id;
      console.log(`  ✓ ${branch.name} (${branch.code})`);
    }
    console.log('✅ Branches created\n');

    // Step 3: Insert Professors
    console.log(`📋 Creating ${PROFESSORS.length} professors...`);
    const profIds = [];
    for (const prof of PROFESSORS) {
      try {
        const result = await pool.query(
          `INSERT INTO professors (name, email, phone, department) 
           VALUES ($1, $2, $3, $4) RETURNING professor_id`,
          [prof.name, prof.email, '9876543210', prof.dept]
        );
        profIds.push(result.rows[0].professor_id);
      } catch (err) {
        console.log(`  ⚠️  Professor ${prof.email} already exists`);
      }
    }
    console.log(`✅ Created ${profIds.length} professors\n`);

    // Step 4: Insert Common Subjects (Sem 1-2)
    console.log('📖 Creating common subjects (Sem 1-2)...');
    const commonSubjectIds = {};
    for (const subject of COMMON_SUBJECTS) {
      try {
        const result = await pool.query(
          `INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count, credits)
           VALUES ($1, $2, $3, $4, $5, $6, 3) RETURNING subject_id`,
          [subject.name, subject.code, subject.type, subject.semester, subject.lectures, subject.labs]
        );
        const subId = result.rows[0].subject_id;
        commonSubjectIds[subject.code] = { id: subId, profIndex: subject.profIndex };

        // Map to professor
        if (subject.profIndex < profIds.length) {
          await pool.query(
            `INSERT INTO professors_subjects (professor_id, subject_id) VALUES ($1, $2)`,
            [profIds[subject.profIndex], subId]
          );
        }
      } catch (err) {
        console.log(`  ⚠️  Subject ${subject.code} creation issue`);
      }
    }
    console.log(`✅ Created ${Object.keys(commonSubjectIds).length} common subjects\n`);

    // Step 5: Map common subjects to all 3 branches
    console.log('🔗 Mapping common subjects to all branches...');
    for (const [code, subData] of Object.entries(commonSubjectIds)) {
      for (const [branchCode, branchId] of Object.entries(branchIds)) {
        try {
          await pool.query(
            `INSERT INTO subjects_branches (subject_id, branch_id, is_applicable) VALUES ($1, $2, TRUE)`,
            [subData.id, branchId]
          );
        } catch (err) {
          // Duplicate, ignore
        }
      }
    }
    console.log('✅ Common subjects mapped to all branches\n');

    // Step 6: Insert Computer Engineering Subjects
    console.log('🖥️  Creating Computer Engineering subjects...');
    await insertBranchSubjects('CE', branchIds['CE'], CE_SUBJECTS, profIds);

    // Step 7: Insert AIML Subjects
    console.log('🤖 Creating AIML subjects...');
    await insertBranchSubjects('AIML', branchIds['AIML'], AIML_SUBJECTS, profIds);

    // Step 8: Insert IoT Subjects
    console.log('📡 Creating IoT subjects...');
    await insertBranchSubjects('IOT', branchIds['IOT'], IOT_SUBJECTS, profIds);

    // Step 9: Create Batches
    console.log('\n🎓 Creating batches...');
    for (const [branchCode, branchId] of Object.entries(branchIds)) {
      for (let batch = 1; batch <= 2; batch++) {
        for (let semester = 1; semester <= 8; semester++) {
          try {
            await pool.query(
              `INSERT INTO batches (branch_id, batch_number, semester) VALUES ($1, $2, $3)`,
              [branchId, batch, semester]
            );
          } catch (err) {
            // Duplicate, ignore
          }
        }
      }
    }
    console.log('✅ Batches created\n');

    // Final Stats
    const profCount = await pool.query('SELECT COUNT(*) as count FROM professors');
    const subjCount = await pool.query('SELECT COUNT(*) as count FROM subjects');
    const branchCount = await pool.query('SELECT COUNT(*) as count FROM branches');
    const mapCount = await pool.query('SELECT COUNT(*) as count FROM professors_subjects');
    const batchCount = await pool.query('SELECT COUNT(*) as count FROM batches');

    console.log('📊 DATA SEEDING COMPLETE!\n');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Professors: ${profCount.rows[0].count}`);
    console.log(`✅ Subjects: ${subjCount.rows[0].count}`);
    console.log(`✅ Branches: ${branchCount.rows[0].count}`);
    console.log(`✅ Professor-Subject Mappings: ${mapCount.rows[0].count}`);
    console.log(`✅ Subject-Branch Mappings: (calculated)`);
    console.log(`✅ Batches: ${batchCount.rows[0].count}`);
    console.log('═══════════════════════════════════════\n');
    console.log('🎉 Database ready with comprehensive academic data!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

async function insertBranchSubjects(branchCode, branchId, subjects, profIds) {
  for (const subject of subjects) {
    try {
      const result = await pool.query(
        `INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count, credits)
         VALUES ($1, $2, $3, $4, $5, $6, 3) RETURNING subject_id`,
        [subject.name, subject.code, subject.type, subject.semester, subject.lectures, subject.labs]
      );
      const subId = result.rows[0].subject_id;

      // Map to professor
      if (subject.profIndex < profIds.length) {
        try {
          await pool.query(
            `INSERT INTO professors_subjects (professor_id, subject_id) VALUES ($1, $2)`,
            [profIds[subject.profIndex], subId]
          );
        } catch (err) {
          // Duplicate mapping, ignore
        }
      }

      // Map to branch
      try {
        await pool.query(
          `INSERT INTO subjects_branches (subject_id, branch_id, is_applicable) VALUES ($1, $2, TRUE)`,
          [subId, branchId]
        );
      } catch (err) {
        // Duplicate, ignore
      }

      console.log(`  ✓ ${subject.code} - Sem ${subject.semester}`);
    } catch (err) {
      console.log(`  ⚠️  ${subject.code} - Issue creating subject`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
