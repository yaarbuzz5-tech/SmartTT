const db = require('./src/config/db');

async function verify() {
  try {
    const branchId = '8e1571fa-2298-49c7-871c-ccdfdd9a6b18';
    const semester = 1;
    
    console.log('Verifying CE Sem 1 timetable in database...\n');
    
    // Get all timetable entries
    const result = await db.query(`
      SELECT t.timetable_id, t.day_of_week, t.time_slot_start, t.time_slot_end,
             t.slot_type, s.name as subject_name, b.batch_number, p.name as professor_name
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      LEFT JOIN batches b ON t.batch_id = b.batch_id
      LEFT JOIN professors p ON t.professor_id = p.professor_id
      WHERE t.branch_id = $1 AND t.semester = $2
      ORDER BY 
        CASE t.day_of_week 
          WHEN 'MON' THEN 1 WHEN 'TUE' THEN 2 WHEN 'WED' THEN 3 
          WHEN 'THU' THEN 4 WHEN 'FRI' THEN 5 
        END,
        t.time_slot_start,
        t.slot_type DESC
    `, [branchId, semester]);
    
    console.log(`Total timetable entries: ${result.rows.length}`);
    
    // Count by type
    const byType = {};
    const byBatch = {};
    
    result.rows.forEach(row => {
      byType[row.slot_type] = (byType[row.slot_type] || 0) + 1;
      if (row.slot_type === 'LAB' && row.batch_number) {
        const key = `Batch ${row.batch_number}`;
        byBatch[key] = (byBatch[key] || 0) + 1;
      }
    });
    
    console.log('\nEntries by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nLabs by batch:');
    Object.entries(byBatch).forEach(([batch, count]) => {
      console.log(`  ${batch}: ${count}`);
    });
    
    console.log('\nFirst 10 lab slots (to verify batch assignment):');
    result.rows.filter(r => r.slot_type === 'LAB').slice(0, 10).forEach(row => {
      console.log(`  ${row.day_of_week} ${row.time_slot_start} | ${row.subject_name} | Batch ${row.batch_number}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

verify();
