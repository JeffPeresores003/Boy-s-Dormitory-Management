// Server/config/config.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL connection pool
const realPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dormitory_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Debug log to confirm pool is loading
console.log("MySQL2 pool created successfully");

// Track DB availability
let dbAvailable = false;

// Test the connection
realPool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    dbAvailable = true;
    connection.release();
  })
  .catch(err => {
    console.warn('Database unavailable — running in mock mode. Errors from DB will return empty results.');
    console.warn('Reason:', err.message);
  });

// Wrapper: returns empty results when DB is unreachable instead of crashing routes
const pool = {
  execute: async (...args) => {
    try {
      return await realPool.execute(...args);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.warn('DB query skipped (no connection):', (args[0] || '').substring(0, 60));
        return [[], []];
      }
      throw err;
    }
  },
  query: async (...args) => {
    try {
      return await realPool.query(...args);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.warn('DB query skipped (no connection):', (args[0] || '').substring(0, 60));
        return [[], []];
      }
      throw err;
    }
  },
  getConnection: () => realPool.getConnection(),
};

module.exports = pool;
