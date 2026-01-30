const pool = require('./src/config/db');

async function debugTimetable() {
  try {
    console.log('\n=== DEBUG: Timetable Data ===\n');

    const result = await pool.query(`
      SELECT 
        t.timetable_id,
        t.day_of_week,
        t.time_slot_start,
        t.slot_type,
        t.subject_id,
        t.professor_id,
        s.name as subject_name,
        p.name as professor_name
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      LEFT JOIN professors p ON t.professor_id = p.professor_id
      WHERE t.semester = 6 AND t.branch_id = '676dcb1c-cdb0-4159-9137-c6a5566e2fa0'
      LIMIT 20
    `);

    console.log('Timetable data:');
    result.rows.forEach(row => {
      console.log(`${row.day_of_week} ${row.time_slot_start} | ${row.slot_type.padEnd(6)} | SubjectID: ${row.subject_id ? 'YES' : 'NULL'} | Subject: ${row.subject_name || 'NULL'} | Prof: ${row.professor_name || 'NULL'}`);
    });

    console.log('\n=== DEBUG: Subject IDs in Timetable ===\n');
    const nullSubjects = await pool.query(`
      SELECT COUNT(*) as count, slot_type FROM timetable 
      WHERE semester = 6 AND branch_id = '676dcb1c-cdb0-4159-9137-c6a5566e2fa0'
      GROUP BY slot_type
    `);

    console.log('Count by type:');
    nullSubjects.rows.forEach(row => {
      console.log(`${row.slot_type}: ${row.count}`);
    });

    const nullCount = await pool.query(`
      SELECT COUNT(*) as count FROM timetable 
      WHERE semester = 6 AND branch_id = '676dcb1c-cdb0-4159-9137-c6a5566e2fa0'
      AND subject_id IS NULL
    `);

    console.log(`\nSlots with NULL subject_id: ${nullCount.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugTimetable();
