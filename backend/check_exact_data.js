const db = require('./src/config/db');

async function checkExactData() {
  try {
    const branchId = '8e1571fa-2298-49c7-871c-ccdfdd9a6b18';
    const semester = 1;
    
    console.log('='.repeat(80));
    console.log('EXACT DATABASE CHECK FOR CE SEMESTER 1');
    console.log('='.repeat(80) + '\n');
    
    // Check what's actually in the timetable
    const result = await db.query(`
      SELECT t.timetable_id, t.slot_type, t.day_of_week, t.time_slot_start,
             s.name as subject_name, b.batch_number, 
             t.batch_id
      FROM timetable t
      LEFT JOIN subjects s ON t.subject_id = s.subject_id
      LEFT JOIN batches b ON t.batch_id = b.batch_id
      WHERE t.branch_id = $1 AND t.semester = $2
      ORDER BY 
        CASE t.day_of_week 
          WHEN 'MON' THEN 1 WHEN 'TUE' THEN 2 WHEN 'WED' THEN 3 
          WHEN 'THU' THEN 4 WHEN 'FRI' THEN 5 
        END,
        t.time_slot_start,
        t.slot_type DESC,
        b.batch_number
    `, [branchId, semester]);
    
    console.log(`Total rows in timetable: ${result.rows.length}\n`);
    
    // Count by batch_number
    const byBatch = {};
    const byType = {};
    const byBatchAndType = {};
    
    result.rows.forEach(row => {
      const typeKey = row.slot_type;
      const batchKey = row.batch_number === 1 ? 'Batch A' : row.batch_number === 2 ? 'Batch B' : 'NULL';
      
      if (!byType[typeKey]) byType[typeKey] = 0;
      byType[typeKey]++;
      
      if (!byBatch[batchKey]) byBatch[batchKey] = 0;
      byBatch[batchKey]++;
      
      const comboKey = `${typeKey}+${batchKey}`;
      if (!byBatchAndType[comboKey]) byBatchAndType[comboKey] = 0;
      byBatchAndType[comboKey]++;
    });
    
    console.log('BY TYPE:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    console.log('\nBY BATCH:');
    Object.entries(byBatch).forEach(([batch, count]) => {
      console.log(`  ${batch}: ${count}`);
    });
    
    console.log('\nBY TYPE + BATCH:');
    Object.entries(byBatchAndType).forEach(([combo, count]) => {
      console.log(`  ${combo}: ${count}`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('FIRST 20 LAB ROWS (TO VERIFY BATCH ASSIGNMENT):');
    console.log('='.repeat(80));
    
    const labRows = result.rows.filter(r => r.slot_type === 'LAB');
    labRows.slice(0, 20).forEach((row, idx) => {
      const batchLabel = row.batch_number === 1 ? 'Batch A' : row.batch_number === 2 ? 'Batch B' : 'NULL';
      console.log(`${String(idx+1).padStart(2)}. ${row.day_of_week} ${row.time_slot_start} | ${row.subject_name.padEnd(30)} | ${batchLabel} | batch_id: ${row.batch_id ? row.batch_id.substring(0, 8) : 'NULL'}`);
    });
    
    if (labRows.length > 20) {
      console.log(`... and ${labRows.length - 20} more lab rows`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkExactData();
