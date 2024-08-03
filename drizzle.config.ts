import { config } from 'dotenv';
import type { Config } from 'drizzle-kit';

config({ path: '.env' })

export default {
  schema: './src/lib/server/schema.ts',
  out: './drizzle',
  dialect: 'postgresql', // 'postgresql' | 'mysql' | 'sqlite'
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: false
  },
} satisfies Config;
