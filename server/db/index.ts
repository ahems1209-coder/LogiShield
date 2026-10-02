/**
 * LogiShield AI - PostgreSQL Connection Pool & High-Performance Data Access
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

export let pool: pg.Pool | null = null;
export let isPostgresConnected = false;

if (databaseUrl && !databaseUrl.includes('YOUR_DATABASE_URL')) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('supabase') || databaseUrl.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
    });

    pool.on('error', (err) => {
      console.warn('[LogiShield DB] PostgreSQL Pool Warning:', err.message);
      isPostgresConnected = false;
    });

    // Initial connection test
    pool.query('SELECT 1').then(() => {
      isPostgresConnected = true;
      console.log('[LogiShield DB] Connected to PostgreSQL Database via Pool.');
    }).catch(err => {
      console.warn('[LogiShield DB] Initial PostgreSQL connection test failed (falling back to in-memory store):', err.message);
      isPostgresConnected = false;
    });
  } catch (err: any) {
    console.warn('[LogiShield DB] Failed to initialize PostgreSQL pool:', err.message);
    isPostgresConnected = false;
  }
} else {
  console.log('[LogiShield DB] DATABASE_URL not set or placeholder. Operating on high-performance in-memory state store.');
}

export async function query(text: string, params?: any[]) {
  if (pool && isPostgresConnected) {
    try {
      return await pool.query(text, params);
    } catch (err: any) {
      console.warn('[LogiShield DB Query Error]:', err.message);
      throw err;
    }
  }
  return null;
}
