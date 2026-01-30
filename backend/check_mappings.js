const pool = require('./src/config/db');

async function checkMapping() {
  try {
    const query = `
      SELECT s.subject_id, s.code, s.name, sb.branch_id, sb.is_applicable, b.name as branch_name
      FROM subjects s
      LEFT JOIN subjects_branches sb ON s.subject_id = sb.subject_id
      LEFT JOIN branches b ON sb.branch_id = b.branch_id
      WHERE s.semester = 1
      ORDER BY s.name, b.name;
    `;
    const result = await pool.query(query);
    
    console.log('\n=== SUBJECT-BRANCH MAPPINGS FOR SEM 1 ===\n');
    
    const bySubject = {};
    result.rows.forEach(row => {
      if (!bySubject[row.code]) {
        bySubject[row.code] = [];
      }
      bySubject[row.code].push({
        branch: row.branch_name || 'NOT MAPPED',
        applicable: row.is_applicable
      });
    });
    
    Object.keys(bySubject).forEach(code => {
      console.log(`\n${code}:`);
      bySubject[code].forEach(mapping => {
        const status = mapping.applicable ? '✓' : '✗';
        console.log(`  ${status} ${mapping.branch}`);
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkMapping();
