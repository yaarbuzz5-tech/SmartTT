/**
 * Diagnostic Script: Check batch system health
 * Verifies:
 * 1. Batches exist in database
 * 2. Batch IDs are properly created
 * 3. Algorithm can see and use batches
 * 4. Schedule object has batch info
 */

const pool = require('./backend/src/config/db');
const TimetableAlgorithm = require('./backend/src/algorithms/TimetableAlgorithm');

async function diagnostics() {
  let connection;
  try {
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('BATCH SYSTEM DIAGNOSTIC CHECK');
    console.log('════════════════════════════════════════════════════════════════\n');

    connection = await pool.connect();

    // Check 1: Database batches exist
    console.log('CHECK 1: Database Batches\n');
    const batchesResult = await connection.query(`
      SELECT batch_id, branch_id, batch_number, semester
      FROM batches
      ORDER BY branch_id, semester, batch_number
      LIMIT 20
    `);

    if (batchesResult.rows.length === 0) {
      console.log('❌ ERROR: No batches found in database!');
      console.log('   The batches table is empty. Batches must be created first.\n');
    } else {
      console.log(`✓ Found ${batchesResult.rows.length} batches:\n`);
      const grouped = {};
      for (const batch of batchesResult.rows) {
        const key = `Branch ${batch.branch_id} - Sem ${batch.semester}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(batch);
      }

      for (const [key, batches] of Object.entries(grouped)) {
        console.log(`  ${key}:`);
        for (const batch of batches) {
          console.log(`    - Batch ${batch.batch_number}: ${batch.batch_id}`);
        }
      }
    }

    // Check 2: Test algorithm with specific branch/semester
    console.log('\n\nCHECK 2: Algorithm Batch Detection\n');

    const testBranchResult = await connection.query(`
      SELECT DISTINCT branch_id FROM branches LIMIT 1
    `);

    if (testBranchResult.rows.length === 0) {
      console.log('❌ ERROR: No branches in database!\n');
    } else {
      const testBranchId = testBranchResult.rows[0].branch_id;
      const testSemester = 6;

      console.log(`Testing with: Branch ${testBranchId}, Semester ${testSemester}\n`);

      // Create algorithm instance
      const algo = new TimetableAlgorithm(testBranchId, testSemester);

      // Call ensureBatchesExist to see what it retrieves
      console.log('Calling ensureBatchesExist()...');
      const batchIds = await algo.ensureBatchesExist();

      console.log(`Result: ${JSON.stringify(batchIds, null, 2)}\n`);

      if (batchIds.length === 0) {
        console.log('❌ ERROR: ensureBatchesExist() returned empty array!');
        console.log('   The batch retrieval is failing.\n');
      } else if (batchIds.length === 1) {
        console.log('⚠️  WARNING: Only 1 batch found, should be 2\n');
      } else if (batchIds.length === 2) {
        console.log('✅ SUCCESS: 2 batches retrieved correctly\n');
        console.log(`  Batch A (index 0): ${batchIds[0].substring(0, 16)}...`);
        console.log(`  Batch B (index 1): ${batchIds[1].substring(0, 16)}...\n`);
      } else {
        console.log(`⚠️  WARNING: Found ${batchIds.length} batches (expected 2)\n`);
      }
    }

    // Check 3: Lab subjects availability
    console.log('\nCHECK 3: Lab Subjects\n');

    const labSubjectsResult = await connection.query(`
      SELECT DISTINCT
        s.subject_id,
        s.name,
        s.type,
        s.weekly_lab_count,
        sb.branch_id
      FROM subjects s
      INNER JOIN subjects_branches sb ON s.subject_id = sb.subject_id
      WHERE sb.is_applicable = TRUE AND (s.type = 'LAB' OR s.type = 'BOTH')
      AND sb.branch_id = (SELECT branch_id FROM branches LIMIT 1)
      LIMIT 10
    `);

    if (labSubjectsResult.rows.length === 0) {
      console.log('⚠️  WARNING: No lab subjects found');
      console.log('   This branch may not have any lab subjects configured.\n');
    } else {
      console.log(`✓ Found ${labSubjectsResult.rows.length} lab subjects:\n`);
      for (const subject of labSubjectsResult.rows) {
        console.log(`  • ${subject.name}`);
        console.log(`    Type: ${subject.type}, Labs/week: ${subject.weekly_lab_count}\n`);
      }
    }

    // Check 4: Current timetable state
    console.log('\nCHECK 4: Current Timetable State\n');

    const currentTimetableResult = await connection.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN slot_type = 'LAB' THEN 1 END) as labs,
        COUNT(DISTINCT batch_id) as batch_count,
        COUNT(CASE WHEN batch_id IS NULL THEN 1 END) as null_batches,
        COUNT(CASE WHEN batch_id IS NOT NULL THEN 1 END) as assigned_batches
      FROM timetables
      WHERE branch_id = (SELECT branch_id FROM branches LIMIT 1)
      AND semester = 6
    `);

    const stats = currentTimetableResult.rows[0];
    console.log(`Total entries: ${stats.total}`);
    console.log(`Lab entries: ${stats.labs}`);
    console.log(`Batches referenced: ${stats.batch_count}`);
    console.log(`  - NULL batches: ${stats.null_batches}`);
    console.log(`  - Assigned batches: ${stats.assigned_batches}\n`);

    if (stats.labs > 0) {
      const labBatchResult = await connection.query(`
        SELECT 
          COALESCE(b.batch_number, 0) as batch_num,
          COUNT(*) as count
        FROM timetables t
        LEFT JOIN batches b ON t.batch_id = b.batch_id
        WHERE t.branch_id = (SELECT branch_id FROM branches LIMIT 1)
        AND t.semester = 6
        AND t.slot_type = 'LAB'
        GROUP BY COALESCE(b.batch_number, 0)
        ORDER BY batch_num
      `);

      console.log('Lab distribution by batch:');
      for (const row of labBatchResult.rows) {
        const batchLabel = row.batch_num === 0 ? 'NULL (no batch)' : `Batch ${row.batch_num}`;
        console.log(`  ${batchLabel}: ${row.count} entries`);
      }
    }

    // Summary and recommendations
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('DIAGNOSTIC SUMMARY');
    console.log('════════════════════════════════════════════════════════════════\n');

    if (batchesResult.rows.length === 0) {
      console.log('❌ CRITICAL: Batches not created');
      console.log('\nRECOMMENDATION:');
      console.log('  Run database initialization script to create batches');
      console.log('  Command: npm run db:init\n');
    } else if (stats.labs === 0) {
      console.log('❌ CRITICAL: No labs in current timetable');
      console.log('\nRECOMMENDATION:');
      console.log('  Delete old timetable and regenerate:');
      console.log('  1. node regenerate_timetable.js\n');
    } else if (stats.batch_count === 1 || (stats.batch_count > 0 && stats.null_batches > 0)) {
      console.log('⚠️  WARNING: Batch assignment incomplete');
      console.log('\nRECOMMENDATION:');
      console.log('  Delete old timetable and regenerate:');
      console.log('  1. DELETE FROM timetables WHERE batch_id IS NULL OR batch_id NOT IN (SELECT batch_id FROM batches);');
      console.log('  2. node regenerate_timetable.js\n');
    } else {
      console.log('✅ SYSTEM HEALTHY');
      console.log('\nAll checks passed. Batch system is working correctly.\n');
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    console.error(error.stack);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

// Run diagnostics
diagnostics();
