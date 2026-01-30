/**
 * Batch Fix Verification Script - Uses HTTP API
 * Doesn't require database connection configuration
 */

const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function verifybatchFix() {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('BATCH ALLOCATION FIX - VERIFICATION VIA API');
  console.log('════════════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check if server is running
    console.log('Step 1: Checking if backend server is running...');
    try {
      const serverCheck = await makeRequest('/api/timetable');
      if (serverCheck.status) {
        console.log('✓ Backend server is running on localhost:5000\n');
      }
    } catch (e) {
      console.error('❌ Cannot connect to backend server on localhost:5000');
      console.error('   Make sure the backend is running: npm start\n');
      process.exit(1);
    }

    // Step 2: Verify timetable exists
    console.log('Step 2: Checking current timetable status...');
    
    // Get branches first
    const branchRes = await makeRequest('/api/branches');
    if (!branchRes.data || !branchRes.data.branches || branchRes.data.branches.length === 0) {
      console.log('⚠️  No branches found. Database may not be initialized.');
      process.exit(1);
    }

    const branchId = branchRes.data.branches[0].branch_id;
    const branchName = branchRes.data.branches[0].name;
    console.log(`✓ Found branch: ${branchName}\n`);

    // Step 3: Regenerate timetable
    console.log('Step 3: Regenerating timetable with batch-aware algorithm...');
    console.log('(This will take 10-30 seconds...)\n');

    const genRes = await makeRequest('/api/timetable/generate', 'POST', {
      branchId: branchId,
      semester: 6
    });

    if (genRes.status !== 200 && genRes.status !== 201) {
      console.error('❌ Timetable generation failed');
      console.error('   Response:', genRes.data);
      process.exit(1);
    }

    if (!genRes.data.success) {
      console.error('❌ Generation error:', genRes.data.error);
      if (genRes.data.details) console.error('   Details:', genRes.data.details);
      process.exit(1);
    }

    console.log('✓ Timetable generated successfully');
    console.log(`  Saved ${genRes.data.timetable?.length || genRes.data.message} entries\n`);

    // Step 4: Get timetable and verify batches
    console.log('Step 4: Verifying batch allocation...\n');

    const ttRes = await makeRequest(`/api/timetable?branchId=${branchId}&semester=6`);
    if (!ttRes.data || !ttRes.data.timetable) {
      console.error('❌ Could not fetch timetable');
      process.exit(1);
    }

    const timetable = ttRes.data.timetable;
    const labEntries = timetable.filter(t => t.slot_type === 'LAB');
    
    if (labEntries.length === 0) {
      console.log('⚠️  No lab entries found in timetable');
      process.exit(1);
    }

    // Count by batch
    const batchCounts = {};
    const subjectsByBatch = {};
    const duplicates = new Map();

    for (const entry of labEntries) {
      const batchId = entry.batch_id || 'null';
      const subjectId = entry.subject_id;
      const day = entry.day_of_week;
      const time = entry.time_slot_start;

      // Count batches
      if (!batchCounts[batchId]) batchCounts[batchId] = 0;
      batchCounts[batchId]++;

      // Track subjects per batch
      if (!subjectsByBatch[batchId]) subjectsByBatch[batchId] = new Set();
      subjectsByBatch[batchId].add(subjectId);

      // Detect duplicates
      const dupKey = `${day}-${time}-${subjectId}-${batchId}`;
      if (!duplicates.has(dupKey)) {
        duplicates.set(dupKey, 0);
      }
      duplicates.set(dupKey, duplicates.get(dupKey) + 1);
    }

    console.log(`Total lab entries: ${labEntries.length}`);
    console.log(`Unique batches: ${Object.keys(batchCounts).length}\n`);

    // Display batch breakdown
    console.log('Batch Breakdown:');
    for (const [batchId, count] of Object.entries(batchCounts)) {
      const batchLabel = batchId === 'null' ? 'NULL (no batch)' : 
                        batchId.includes('1') ? 'Batch A' :
                        batchId.includes('2') ? 'Batch B' : 
                        `Batch (${batchId.substring(0, 8)}...)`;
      const subjects = subjectsByBatch[batchId]?.size || 0;
      console.log(`  ${batchLabel}: ${count} lab sessions, ${subjects} subjects`);
    }

    console.log('');

    // Step 5: Check for duplicates
    console.log('Step 5: Duplicate Check\n');
    
    let hasDuplicates = false;
    for (const [key, count] of duplicates.entries()) {
      if (count > 1) {
        console.log(`❌ Duplicate found: ${key} (count: ${count})`);
        hasDuplicates = true;
      }
    }

    if (!hasDuplicates) {
      console.log('✅ No duplicates detected\n');
    }

    // Step 6: Batch coverage check
    console.log('Step 6: Batch Coverage\n');

    const batchAExists = Object.keys(batchCounts).some(bid => 
      batchCounts[bid] > 0 && bid.includes('1')
    );
    const batchBExists = Object.keys(batchCounts).some(bid => 
      batchCounts[bid] > 0 && bid.includes('2')
    );

    if (batchAExists) {
      console.log('✅ Batch A (Batch 1) is scheduled');
    } else {
      console.log('❌ Batch A (Batch 1) is MISSING');
    }

    if (batchBExists) {
      console.log('✅ Batch B (Batch 2) is scheduled');
    } else {
      console.log('❌ Batch B (Batch 2) is MISSING');
    }

    // Final result
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('VERIFICATION RESULT');
    console.log('════════════════════════════════════════════════════════════════\n');

    if (batchAExists && batchBExists && !hasDuplicates) {
      console.log('✅✅✅ SUCCESS ✅✅✅');
      console.log('\nThe batch allocation fix is working correctly!');
      console.log('Both Batch A and Batch B are properly scheduled with no duplicates.\n');
    } else {
      console.log('❌ VERIFICATION FAILED\n');
      if (!batchAExists) console.log('  - Batch A is missing');
      if (!batchBExists) console.log('  - Batch B is missing');
      if (hasDuplicates) console.log('  - Duplicates detected');
      console.log('');
    }

    process.exit(batchAExists && batchBExists && !hasDuplicates ? 0 : 1);

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    process.exit(1);
  }
}

// Run verification
verifybatchFix();
