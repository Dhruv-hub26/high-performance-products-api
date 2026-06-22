import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

function normalizePoolerConnectionString(raw?: string): string | undefined {
  if (!raw) {
    return raw;
  }

  return raw
    .replace(/[&?]channel_binding=[^&]*/gi, '')
    .replace(/\?&/, '?')
    .replace(/[?&]$/, '');
}

const dbConnectionString = normalizePoolerConnectionString(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: dbConnectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
