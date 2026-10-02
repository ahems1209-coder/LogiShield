/**
 * LogiShield AI - Database Migration Executor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, isPostgresConnected } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('[LogiShield Migration] Executing database schema migrations...');
  if (!pool) {
    console.log('[LogiShield Migration] PostgreSQL pool not configured. Skipping schema DDL execution.');
    return;
  }

  try {
    const sqlPath = path.resolve(__dirname, 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await pool.query(sql);
    await pool.query('ALTER TABLE routes ALTER COLUMN transit_hours_nominal TYPE NUMERIC(8,2)');
    console.log('[LogiShield Migration] Database schema migration completed successfully.');
  } catch (err: any) {
    console.error('[LogiShield Migration Error]:', err.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().then(() => process.exit(0)).catch(() => process.exit(1));
}
