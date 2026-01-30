const pool = require('./src/config/db');

async function checkBatchLabAllocations() {
  try {
    const query = `
      SELECT 
        t.day_of_week,
        t.time_slot_start,
        t.slot_type,
        s.name as subject_name,
        bat.batch_number,
        bat.batch_id,
        COUNT(*) as count
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      LEFT JOIN batches bat ON t.batch_id = bat.batch_id
      WHERE t.branch_id = 'e72b8c0f-fb48-4f19-bedc-c2b65373be48'
        AND t.semester = 1
        AND t.slot_type = 'LAB'
      GROUP BY t.day_of_week, t.time_slot_start, t.slot_type, s.name, bat.batch_number, bat.batch_id
      ORDER BY t.day_of_week, t.time_slot_start, bat.batch_number;
    `;

    const result = await pool.query(query);
    
    console.log('\n=== LAB ALLOCATION FOR CE SEM 1 ===\n');
    console.log('Total lab entries:', result.rows.length);
    console.log('\nBreakdown by batch:');
    
    const byBatch = {};
    result.rows.forEach(row => {
      const batchKey = row.batch_number ? `Batch ${row.batch_number}` : 'NULL/COMMON';
      if (!byBatch[batchKey]) {
        byBatch[batchKey] = 0;
      }
      byBatch[batchKey]++;
    });
    
    console.log(byBatch);
    
    console.log('\nDetailed entries:');
    result.rows.forEach(row => {
      const batchLabel = row.batch_number ? `Batch ${row.batch_number}` : 'NULL (common)';
      console.log(`${row.day_of_week} ${row.time_slot_start} | ${row.subject_name} | ${batchLabel} (ID: ${row.batch_id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBatchLabAllocations();
