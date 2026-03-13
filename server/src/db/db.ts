import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import { logger } from '../utils/logger';
import 'dotenv/config';

let db: (MySql2Database<typeof schema> & { $client: mysql.Pool }) | undefined;

try {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wheel_db',
  });

  // Test the connection to ensure the database is actually reachable
  const connection = await pool.getConnection();
  connection.release();

  db = drizzle(pool, { schema, mode: 'default' });
  logger.info('✅ Database connected successfully');
} catch (error) {
  logger.warn(
    { err: error },
    '⚠️ Database connection failed. Running without database. User info will be saved in localStorage only.'
  );
}

export { db };
