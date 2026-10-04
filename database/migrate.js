import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';


const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, '../.env.local')
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const runMigrations = async () => {
  try {
    console.log('Starting database migrations...\n');

    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Get already executed migrations
    const result = await pool.query('SELECT filename FROM migrations');
    const executedMigrations = result.rows.map(row => row.filename);

    // Run pending migrations
    let executedCount = 0;
    for (const file of files) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        
        // Execute migration in a transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(sql);
          await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`✓ ${file} completed\n`);
          executedCount++;
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
      }
    }

    if (executedCount === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`\n✓ Successfully executed ${executedCount} migration(s)`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();
