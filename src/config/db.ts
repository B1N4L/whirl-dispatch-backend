import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema/index';
import dotenv from 'dotenv';

dotenv.config();

const pooledUrl = process.env.DATABASE_URL;
const unpooledUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!pooledUrl) {
  console.warn('[WARN] DATABASE_URL environment variable is not defined.');
}

// Standard pooled connection for serverless API runtime queries
export const sql = neon(pooledUrl || '');
export const db = drizzle(sql, { schema });

// Direct unpooled connection for migrations, batch sync, and administrative tasks
export const unpooledSql = neon(unpooledUrl || '');
export const unpooledDb = drizzle(unpooledSql, { schema });
