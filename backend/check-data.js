#!/usr/bin/env node

process.env.DB_HOST = 'dpg-d5uftbp4tr6s73enb1lg-a.virginia-postgres.render.com';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'smarttt_db';
process.env.DB_USER = 'smarttt_db_user';
process.env.DB_PASSWORD = 'A3vjyDGRmwCAeVJpvXIJLhfafKc1ssXu';
process.env.NODE_ENV = 'production';

const pool = require('./src/config/db');

const checkData = async () => {
  try {
    console.log('Checking database data...\n');
    
    const professors = await pool.query('SELECT COUNT(*) FROM professors');
    console.log('✅ Professors:', professors.rows[0].count);
    
    const subjects = await pool.query('SELECT COUNT(*) FROM subjects');
    console.log('✅ Subjects:', subjects.rows[0].count);
    
    const branches = await pool.query('SELECT COUNT(*) FROM branches');
    console.log('✅ Branches:', branches.rows[0].count);
    
    const mappings = await pool.query('SELECT COUNT(*) FROM professors_subjects');
    console.log('✅ Professor-Subject Mappings:', mappings.rows[0].count);
    
    const subBranch = await pool.query('SELECT COUNT(*) FROM subjects_branches');
    console.log('✅ Subject-Branch Mappings:', subBranch.rows[0].count);
    
    const batches = await pool.query('SELECT COUNT(*) FROM batches');
    console.log('✅ Batches:', batches.rows[0].count);
    
    const timetables = await pool.query('SELECT COUNT(*) FROM timetable');
    console.log('✅ Timetables:', timetables.rows[0].count);
    
    console.log('\n🎉 Data check complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkData();
