const pool = require('./src/config/db');

async function checkAllTimetable() {
  try {
    // First, get all timetable records for CE Sem 1
    const countQuery = `SELECT COUNT(*) as total FROM timetable WHERE branch_id = 'e72b8c0f-fb48-4f19-bedc-c2b65373be48' AND semester = 1;`;
    const countResult = await pool.query(countQuery);
    console.log('\n=== CE SEMESTER 1 TIMETABLE ===');
    console.log('Total entries:', countResult.rows[0].total);
    
    // Get breakdown by slot type
    const typeQuery = `
      SELECT slot_type, COUNT(*) as count 
      FROM timetable 
      WHERE branch_id = 'e72b8c0f-fb48-4f19-bedc-c2b65373be48' AND semester = 1 
      GROUP BY slot_type;
    `;
    const typeResult = await pool.query(typeQuery);
    console.log('\nBreakdown by type:');
    typeResult.rows.forEach(row => {
      console.log(`  ${row.slot_type}: ${row.count}`);
    });
    
    // Get all labs
    const labQuery = `
      SELECT t.day_of_week, t.time_slot_start, s.name, t.batch_id, t.timetable_id
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      WHERE t.branch_id = 'e72b8c0f-fb48-4f19-bedc-c2b65373be48' 
        AND t.semester = 1 
        AND t.slot_type = 'LAB'
      ORDER BY t.day_of_week, t.time_slot_start;
    `;
    const labResult = await pool.query(labQuery);
    console.log('\nAll LAB entries:');
    if (labResult.rows.length === 0) {
      console.log('  (NO LABS FOUND)');
    } else {
      labResult.rows.forEach(row => {
        console.log(`  ${row.day_of_week} ${row.time_slot_start} | ${row.name} | Batch: ${row.batch_id || 'NULL'}`);
      });
    }
    
    // Get theories
    const theoryQuery = `
      SELECT t.day_of_week, t.time_slot_start, s.name, t.timetable_id
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      WHERE t.branch_id = 'e72b8c0f-fb48-4f19-bedc-c2b65373be48' 
        AND t.semester = 1 
        AND t.slot_type = 'THEORY'
      ORDER BY t.day_of_week, t.time_slot_start;
    `;
    const theoryResult = await pool.query(theoryQuery);
    console.log('\nAll THEORY entries:');
    if (theoryResult.rows.length === 0) {
      console.log('  (NO THEORIES FOUND)');
    } else {
      theoryResult.rows.forEach(row => {
        console.log(`  ${row.day_of_week} ${row.time_slot_start} | ${row.name}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAllTimetable();
