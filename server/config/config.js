// Server/config/config.js
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Create MySQL connection pool
const realPool = mysql.createPool({
  host: process.env.DB_HOST || '192.185.48.158',
  user: process.env.DB_USER || 'bisublar_bds',
  password: process.env.DB_PASSWORD || 'B1subl4r_bds<3!',
  database: process.env.DB_NAME || 'bisublar_bds',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Debug log to confirm pool is loading
console.log("MySQL2 pool created successfully");

// Test the connection on startup
realPool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = realPool;
