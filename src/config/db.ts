import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema/index.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:placeholder@ep-cool-sample.us-east-2.aws.neon.tech/whirldispatch?sslmode=require';

// Connection pooling for serverless execution
export const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
