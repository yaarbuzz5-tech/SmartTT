#!/usr/bin/env node

process.env.DB_HOST = 'dpg-d5uftbp4tr6s73enb1lg-a.virginia-postgres.render.com';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'smarttt_db';
process.env.DB_USER = 'smarttt_db_user';
process.env.DB_PASSWORD = 'A3vjyDGRmwCAeVJpvXIJLhfafKc1ssXu';
process.env.NODE_ENV = 'production';

require('./src/seeds/seedDataComplete.js');
