import { mysqlTable, serial, varchar, timestamp } from 'drizzle-orm/mysql-core';

export const wheels = mysqlTable('wheels', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});