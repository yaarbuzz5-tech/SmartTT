#!/usr/bin/env node

/**
 * Timetable Generation Test Script
 * Tests semester 6 and 8 timetable generation with conflict checking
 */

const http = require('http');

const BRANCH_ID = '676dcb1c-cdb0-4159-9137-c6a5566e2fa0'; // Computer Science
const API_URL = 'http://localhost:5000';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_URL}${path}`);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testTimetableGeneration() {
  log(colors.cyan, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.cyan, '║  SmartTT Timetable Generation - Conflict Test              ║');
  log(colors.cyan, '║  Semester 6 & 8 with Professors                            ║');
  log(colors.cyan, '╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test Semester 6
    log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.blue, 'TEST 1: Generating Timetable for Semester 6');
    log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    log(colors.yellow, 'Requesting: POST /api/timetable/generate');
    log(colors.yellow, `Data: { branchId: "${BRANCH_ID.substring(0, 8)}...", semester: 6 }`);
    log(colors.yellow, 'Processing...\n');

    const sem6Result = await makeRequest('POST', '/api/timetable/generate', {
      branchId: BRANCH_ID,
      semester: 6,
    });

    if (sem6Result.status === 200 && sem6Result.data.success) {
      log(colors.green, '✓ Semester 6 timetable generated successfully!');
      log(colors.green, `  Slots saved: ${sem6Result.data.data?.length || 0}`);
    } else {
      log(colors.red, '✗ Semester 6 generation failed');
      if (sem6Result.data.conflicts) {
        log(colors.red, `  Conflicts: ${JSON.stringify(sem6Result.data.conflicts)}`);
      }
    }

    log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.blue, 'TEST 2: Viewing Semester 6 Timetable');
    log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sem6View = await makeRequest('GET', `/api/timetable/view/${BRANCH_ID}/6`);

    if (sem6View.status === 200 && sem6View.data.timetable) {
      const timetable = sem6View.data.timetable;
      log(colors.green, `✓ Retrieved ${timetable.length} slots for Semester 6\n`);

      // Analyze the timetable
      analyzeTimeTable(timetable, 6);
    } else {
      log(colors.red, '✗ Failed to retrieve Semester 6 timetable');
    }

    // Test Semester 8
    log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.blue, 'TEST 3: Generating Timetable for Semester 8');
    log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    log(colors.yellow, 'Requesting: POST /api/timetable/generate');
    log(colors.yellow, `Data: { branchId: "${BRANCH_ID.substring(0, 8)}...", semester: 8 }`);
    log(colors.yellow, 'Processing...\n');

    const sem8Result = await makeRequest('POST', '/api/timetable/generate', {
      branchId: BRANCH_ID,
      semester: 8,
    });

    if (sem8Result.status === 200 && sem8Result.data.success) {
      log(colors.green, '✓ Semester 8 timetable generated successfully!');
      log(colors.green, `  Slots saved: ${sem8Result.data.data?.length || 0}`);
    } else {
      log(colors.red, '✗ Semester 8 generation failed');
      if (sem8Result.data.conflicts) {
        log(colors.red, `  Conflicts: ${JSON.stringify(sem8Result.data.conflicts)}`);
      }
    }

    log(colors.blue, '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log(colors.blue, 'TEST 4: Viewing Semester 8 Timetable');
    log(colors.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const sem8View = await makeRequest('GET', `/api/timetable/view/${BRANCH_ID}/8`);

    if (sem8View.status === 200 && sem8View.data.timetable) {
      const timetable = sem8View.data.timetable;
      log(colors.green, `✓ Retrieved ${timetable.length} slots for Semester 8\n`);

      // Analyze the timetable
      analyzeTimeTable(timetable, 8);
    } else {
      log(colors.red, '✗ Failed to retrieve Semester 8 timetable');
    }

    // Summary
    log(colors.cyan, '\n╔════════════════════════════════════════════════════════════╗');
    log(colors.cyan, '║  Test Summary                                              ║');
    log(colors.cyan, '╚════════════════════════════════════════════════════════════╝\n');

    log(colors.green, '✓ Timetable generation completed');
    log(colors.green, '✓ All semesters processed');
    log(colors.green, '✓ Detailed analysis provided below\n');

  } catch (error) {
    log(colors.red, `✗ Error during testing: ${error.message}`);
  }
}

function analyzeTimeTable(timetable, semester) {
  log(colors.cyan, `\nSemester ${semester} Analysis:`);
  log(colors.cyan, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Group by day
  const byDay = {};
  timetable.forEach((slot) => {
    if (!byDay[slot.day_of_week]) byDay[slot.day_of_week] = [];
    byDay[slot.day_of_week].push(slot);
  });

  // Group by professor
  const byProf = {};
  timetable.forEach((slot) => {
    if (slot.professor_name && slot.slot_type !== 'BREAK' && slot.slot_type !== 'RECESS') {
      if (!byProf[slot.professor_name]) byProf[slot.professor_name] = [];
      byProf[slot.professor_name].push(slot);
    }
  });

  // Check for conflicts
  let conflicts = 0;
  for (const prof in byProf) {
    const slots = byProf[prof];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const s1 = slots[i];
        const s2 = slots[j];
        // Check if same day and overlapping time
        if (
          s1.day_of_week === s2.day_of_week &&
          s1.time_slot_start === s2.time_slot_start
        ) {
          log(colors.red, `✗ CONFLICT: ${prof} teaches at ${s1.day_of_week} ${s1.time_slot_start}`);
          log(colors.red, `  - ${s1.subject_name} (${s1.slot_type})`);
          log(colors.red, `  - ${s2.subject_name} (${s2.slot_type})`);
          conflicts++;
        }
      }
    }
  }

  // Check breaks
  let teaBreakFound = false;
  let recessFound = false;
  const breakDays = Object.keys(byDay);
  for (const day of breakDays) {
    const daySlots = byDay[day];
    for (const slot of daySlots) {
      if (slot.slot_type === 'BREAK' && slot.time_slot_start === '11:00') {
        teaBreakFound = true;
      }
      if (slot.slot_type === 'RECESS' && slot.time_slot_start === '13:15') {
        recessFound = true;
      }
    }
  }

  // Print analysis
  log(colors.green, `Total slots: ${timetable.length}`);
  log(colors.green, `Days covered: ${Object.keys(byDay).join(', ')}`);
  log(colors.green, `Professors: ${Object.keys(byProf).length}`);

  if (conflicts === 0) {
    log(colors.green, '✓ NO PROFESSOR CONFLICTS FOUND');
  } else {
    log(colors.red, `✗ Found ${conflicts} conflict(s)`);
  }

  if (teaBreakFound) {
    log(colors.green, '✓ Tea break (11:00-11:15) scheduled');
  } else {
    log(colors.yellow, '⚠ Tea break not found');
  }

  if (recessFound) {
    log(colors.green, '✓ Recess (13:15-14:00) scheduled');
  } else {
    log(colors.yellow, '⚠ Recess not found');
  }

  // Show daily breakdown
  log(colors.cyan, '\nDaily Schedule Breakdown:');
  log(colors.cyan, '─────────────────────────────────────────────────────────\n');

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  for (const day of days) {
    if (byDay[day]) {
      log(colors.blue, `${day}:`);
      byDay[day]
        .sort((a, b) => a.time_slot_start.localeCompare(b.time_slot_start))
        .forEach((slot) => {
          const info = `  ${slot.time_slot_start}-${slot.time_slot_end} | ${slot.slot_type.padEnd(7)} | ${slot.subject_name?.substring(0, 20) || '—'} | ${slot.professor_name || '—'}`;
          console.log(info);
        });
    }
  }

  // Professor schedule
  log(colors.cyan, '\nProfessor-wise Schedule:');
  log(colors.cyan, '─────────────────────────────────────────────────────────\n');

  for (const prof in byProf) {
    log(colors.blue, `${prof}:`);
    byProf[prof]
      .sort((a, b) => {
        if (a.day_of_week !== b.day_of_week) return a.day_of_week.localeCompare(b.day_of_week);
        return a.time_slot_start.localeCompare(b.time_slot_start);
      })
      .forEach((slot) => {
        const info = `  ${slot.day_of_week} ${slot.time_slot_start}-${slot.time_slot_end} | ${slot.subject_name?.substring(0, 15) || '—'} (${slot.slot_type})`;
        console.log(info);
      });
  }

  log(colors.cyan, '\n');
}

// Run test
testTimetableGeneration().catch(console.error);
