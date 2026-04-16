'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME     || 'postgres',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Run a parameterised query and return the result.
 * @param {string} text   SQL string, may contain $1 … $n placeholders.
 * @param {Array}  params Optional parameter array.
 * @returns {Promise<import('pg').QueryResult>}
 */
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
