import { drizzle } from 'drizzle-orm/d1';

export function createDatabase(database: D1Database) {
  return drizzle(database);
}
