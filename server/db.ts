import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import 'dotenv/config';

let db: (MySql2Database<typeof schema> & { $client: mysql.Connection }) | undefined;

try {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wheel_db',
  });

  db = drizzle(connection, { schema, mode: 'default' });
  console.log('✅ Database connected successfully');
} catch {
  console.warn(
    '⚠️ Database connection failed. Running without database. User info will be saved in localStorage only.'
  );
}

export { db };
