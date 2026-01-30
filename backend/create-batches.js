#!/usr/bin/env node

process.env.DB_HOST = 'dpg-d5uftbp4tr6s73enb1lg-a.virginia-postgres.render.com';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'smarttt_db';
process.env.DB_USER = 'smarttt_db_user';
process.env.DB_PASSWORD = 'A3vjyDGRmwCAeVJpvXIJLhfafKc1ssXu';
process.env.NODE_ENV = 'production';

const pool = require('./src/config/db');

const createBatches = async () => {
  try {
    console.log('🎓 Creating batches for all branches and semesters...\n');
    
    // Get all branches
    const branches = await pool.query('SELECT branch_id FROM branches');
    
    let batchCount = 0;
    
    for (const branch of branches.rows) {
      for (let batch = 1; batch <= 2; batch++) {
        for (let semester = 1; semester <= 8; semester++) {
          try {
            await pool.query(
              `INSERT INTO batches (branch_id, batch_number, semester) VALUES ($1, $2, $3)`,
              [branch.branch_id, batch, semester]
            );
            batchCount++;
          } catch (err) {
            // Duplicate, skip
          }
        }
      }
    }
    
    console.log(`✅ Created ${batchCount} batches\n`);
    
    // Verify
    const result = await pool.query('SELECT COUNT(*) as count FROM batches');
    console.log(`📊 Total batches in database: ${result.rows[0].count}\n`);
    
    console.log('🎉 Batch creation complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createBatches();
