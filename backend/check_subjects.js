const pool = require('./src/config/db');

async function checkSubjects() {
  try {
    // Check all subjects for this branch
    const query = `
      SELECT s.subject_id, s.code, s.name, s.semester, s.type, sb.is_applicable
      FROM subjects s
      LEFT JOIN subjects_branches sb ON s.subject_id = sb.subject_id AND sb.branch_id = $1
      WHERE s.semester = 1
      ORDER BY s.name;
    `;
    const result = await pool.query(query, ['e72b8c0f-fb48-4f19-bedc-c2b65373be48']);

    console.log('\n=== SUBJECTS IN DATABASE ===\n');
    result.rows.forEach(row => {
      console.log(`${row.name.padEnd(40)} | Type: ${row.type.padEnd(6)} | Sem: ${row.semester} | Theory: ${row.weekly_lecture_count} | Lab: ${row.weekly_lab_count}`);
    });

    console.log('\n=== SUBJECTS BY SEMESTER ===\n');
    const bySemester = {};
    result.rows.forEach(row => {
      if (!bySemester[row.semester]) bySemester[row.semester] = [];
      bySemester[row.semester].push(row);
    });

    Object.keys(bySemester).sort().forEach(sem => {
      console.log(`\nSemester ${sem}:`);
      bySemester[sem].forEach(s => {
        console.log(`  - ${s.name} (${s.type}, Theory: ${s.weekly_lecture_count}, Lab: ${s.weekly_lab_count})`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSubjects();
