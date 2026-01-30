const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Insert Professors
    const professors = [
      { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@college.edu', phone: '9876543210', department: 'CSE' },
      { name: 'Prof. Anjali Singh', email: 'anjali.singh@college.edu', phone: '9876543211', department: 'CSE' },
      { name: 'Dr. Priya Verma', email: 'priya.verma@college.edu', phone: '9876543212', department: 'ECE' },
      { name: 'Prof. Amit Sharma', email: 'amit.sharma@college.edu', phone: '9876543213', department: 'ECE' },
      { name: 'Dr. Neha Gupta', email: 'neha.gupta@college.edu', phone: '9876543214', department: 'CSE' },
      { name: 'Prof. Vikas Patel', email: 'vikas.patel@college.edu', phone: '9876543215', department: 'Mechanical' },
    ];

    for (const prof of professors) {
      try {
        await pool.query(
          `INSERT INTO professors (name, email, phone, department) VALUES ($1, $2, $3, $4)`,
          [prof.name, prof.email, prof.phone, prof.department]
        );
      } catch (err) {
        // Ignore duplicate professors
        console.log(`⚠️  Professor ${prof.email} already exists`);
      }
    }
    console.log('✅ Professors added');

    // Get professor IDs
    const profResult = await pool.query(`SELECT professor_id, name FROM professors LIMIT 6`);
    const profIds = profResult.rows.map(r => r.professor_id);

    // Insert Subjects
    const subjects = [
      { name: 'Data Structures', code: 'CS201', type: 'THEORY', semester: 2, lectures: 3, labs: 1 },
      { name: 'Web Development', code: 'CS301', type: 'BOTH', semester: 3, lectures: 2, labs: 2 },
      { name: 'Database Management', code: 'CS202', type: 'THEORY', semester: 2, lectures: 4, labs: 0 },
      { name: 'Digital Logic', code: 'ECE201', type: 'THEORY', semester: 2, lectures: 3, labs: 2 },
      { name: 'Signals and Systems', code: 'ECE301', type: 'THEORY', semester: 3, lectures: 3, labs: 1 },
      { name: 'Microprocessors', code: 'ECE302', type: 'LAB', semester: 3, lectures: 0, labs: 3 },
      { name: 'Machine Learning', code: 'CS401', type: 'BOTH', semester: 4, lectures: 3, labs: 2 },
      { name: 'Operating Systems', code: 'CS202', type: 'BOTH', semester: 4, lectures: 3, labs: 2 },
      { name: 'Java Programming', code: 'CS101', type: 'BOTH', semester: 1, lectures: 2, labs: 2 },
      { name: 'Python Basics', code: 'CS102', type: 'BOTH', semester: 1, lectures: 2, labs: 2 },
    ];

    const subjectIds = [];
    for (const subject of subjects) {
      try {
        const result = await pool.query(
          `INSERT INTO subjects (name, code, type, semester, weekly_lecture_count, weekly_lab_count, credits)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING subject_id`,
          [subject.name, subject.code, subject.type, subject.semester, subject.lectures, subject.labs, 3]
        );
        if (result.rows.length > 0) {
          subjectIds.push(result.rows[0].subject_id);
        }
      } catch (err) {
        // Ignore duplicate subjects
        console.log(`⚠️  Subject ${subject.code} already exists`);
      }
    }
    console.log('✅ Subjects added');

    // Map professors to subjects
    for (let i = 0; i < Math.min(profIds.length, subjectIds.length); i++) {
      try {
        await pool.query(
          `INSERT INTO professors_subjects (professor_id, subject_id) 
           VALUES ($1, $2)`,
          [profIds[i], subjectIds[i]]
        );
      } catch (err) {
        // Ignore duplicates
      }
    }
    console.log('✅ Professor-Subject mappings added');

    // Get branch IDs
    const branchResult = await pool.query(`SELECT branch_id FROM branches LIMIT 5`);
    const branchIds = branchResult.rows.map(r => r.branch_id);

    // Map subjects to branches
    for (const subjectId of subjectIds) {
      for (let i = 0; i < Math.min(2, branchIds.length); i++) {
        try {
          await pool.query(
            `INSERT INTO subjects_branches (subject_id, branch_id, is_applicable)
             VALUES ($1, $2, TRUE)`,
            [subjectId, branchIds[i]]
          );
        } catch (err) {
          // Ignore duplicates
        }
      }
    }
    console.log('✅ Subject-Branch mappings added');

    // Create batches
    console.log(`Creating batches for ${branchIds.length} branches...`);
    for (const branchId of branchIds) {
      for (let batch = 1; batch <= 2; batch++) {
        for (let sem = 2; sem <= 4; sem += 2) {
          try {
            await pool.query(
              `INSERT INTO batches (branch_id, batch_number, semester)
               VALUES ($1, $2, $3)`,
              [branchId, batch, sem]
            );
          } catch (err) {
            console.log(`⚠️  Batch for branch ${branchId}, batch ${batch}, sem ${sem} already exists`);
          }
        }
      }
    }
    console.log('✅ Batches created');

    console.log('🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
