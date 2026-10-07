import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!unpooledUrl) {
  console.error('[ERROR] DATABASE_URL_UNPOOLED or DATABASE_URL must be provided.');
  process.exit(1);
}

async function runMigrations() {
  console.log('[MIGRATION] Connecting to NeonDB using unpooled connection...');
  const sql = neon(unpooledUrl!);
  const db = drizzle(sql);

  console.log('[MIGRATION] Applying migrations from ./drizzle/migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('[MIGRATION] Schema migrations applied successfully.');
}

runMigrations().catch((err) => {
  console.error('[MIGRATION] Failed to execute migrations:', err);
  process.exit(1);
});
