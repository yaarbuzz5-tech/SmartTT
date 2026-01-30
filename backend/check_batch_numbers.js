const db = require('./src/config/db');

async function checkBatches() {
  try {
    const branchId = '8e1571fa-2298-49c7-871c-ccdfdd9a6b18';
    const semester = 1;
    
    console.log('Checking batch numbers for CE Sem 1...\n');
    
    const result = await db.query(`
      SELECT batch_id, batch_number
      FROM batches
      WHERE branch_id = $1 AND semester = $2
      ORDER BY batch_number
    `, [branchId, semester]);
    
    console.log('Batches found:');
    result.rows.forEach(row => {
      console.log(`  ID: ${row.batch_id}`);
      console.log(`  Number: ${row.batch_number}`);
      console.log(`  Label: ${row.batch_number === 1 ? 'Batch A' : 'Batch B'}`);
      console.log();
    });
    
    // Also check what the algorithm is actually storing
    console.log('\nChecking timetable batch assignments:');
    const ttResult = await db.query(`
      SELECT DISTINCT t.batch_id, b.batch_number, COUNT(*) as count
      FROM timetable t
      LEFT JOIN batches b ON t.batch_id = b.batch_id
      WHERE t.branch_id = $1 AND t.semester = $2 AND t.slot_type = 'LAB'
      GROUP BY t.batch_id, b.batch_number
      ORDER BY b.batch_number
    `, [branchId, semester]);
    
    console.log('Lab slots by batch:');
    ttResult.rows.forEach(row => {
      console.log(`  Batch ID: ${row.batch_id}`);
      console.log(`  Batch Number: ${row.batch_number}`);
      console.log(`  Label: ${row.batch_number === 1 ? 'Batch A' : 'Batch B'}`);
      console.log(`  Lab Count: ${row.count}`);
      console.log();
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBatches();
