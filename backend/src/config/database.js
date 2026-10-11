import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../../../.env.local')
});

// Neon-optimized connection pool configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection timeout - fail fast instead of hanging (can be overridden by env var)
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  // Close idle connections after 30 seconds
  idleTimeoutMillis: 30000,
  // Maximum pool size (Neon free tier handles this well)
  max: 10,
  // Statement timeout - prevent long-running queries (can be overridden by env var)
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '10000')
};

// SSL configuration
const hasConnectionStringSslMode = (() => {
  try { return new URL(process.env.DATABASE_URL).searchParams.has('sslmode'); }
  catch { return false; }
})();

// Neon requires SSL in production
if ((process.env.NODE_ENV === 'production' || !hasConnectionStringSslMode) && process.env.DATABASE_URL?.includes('neon.tech')) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

/**
 * Helper to identify database connection errors
 */
export const isDatabaseConnectionError = (error) => {
  if (!error) return false;

  // Network/connection errors
  const connectionErrors = ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET'];
  if (connectionErrors.includes(error.code)) return true;

  // PostgreSQL connection errors
  if (error.message?.includes('connect ETIMEDOUT')) return true;
  if (error.message?.includes('Connection terminated')) return true;
  if (error.message?.includes('database system is starting up')) return true;

  return false;
};

/**
 * Execute query with automatic retry for transient failures
 */
export const query = async (text, params, retries = 2) => {
  const start = Date.now();
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;

      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: res.rowCount });
      }

      return res;
    } catch (error) {
      lastError = error;

      // Don't retry non-connection errors
      if (!isDatabaseConnectionError(error)) {
        console.error('Database query error (no retry):', error.message);
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === retries) {
        console.error('Database query failed after retries:', error.message);
        throw error;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(100 * Math.pow(2, attempt), 1000);
      console.warn(`Database connection error, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

export const getClient = async () => {
  return await pool.connect();
};

export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW()');
    return { connected: true, timestamp: result.rows[0].now };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

export default pool;
