const pool = require('./src/config/db');

const testSeed = async () => {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected at:', result.rows[0]);
    
    // Check branches
    const branchResult = await pool.query('SELECT branch_id, name FROM branches LIMIT 5');
    console.log('✅ Branches in database:', branchResult.rows.length);
    branchResult.rows.forEach(b => console.log(`   - ${b.name} (${b.branch_id})`));
    
    // Check professors
    const profResult = await pool.query('SELECT professor_id, name, email FROM professors LIMIT 5');
    console.log('✅ Professors in database:', profResult.rows.length);
    profResult.rows.forEach(p => console.log(`   - ${p.name}`));
    
    // Check subjects
    const subjResult = await pool.query('SELECT subject_id, name, code FROM subjects LIMIT 5');
    console.log('✅ Subjects in database:', subjResult.rows.length);
    subjResult.rows.forEach(s => console.log(`   - ${s.name} (${s.code})`));
    
    // Check batches
    const batchResult = await pool.query('SELECT COUNT(*) as count FROM batches');
    console.log('✅ Batches in database:', batchResult.rows[0].count);
    
    console.log('\n✅ All data checks passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  testSeed();
}
