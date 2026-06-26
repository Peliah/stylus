/**
 * Prisma 7 configuration file.
 * Connection URLs for Migrate must be defined here instead of schema.prisma.
 * Loads DATABASE_URL from the monorepo root .env file since the env is defined there.
 * See: https://pris.ly/d/config-datasource
 */
import path from 'path';
import { defineConfig } from 'prisma/config';
import { config as loadEnv } from 'dotenv';

const envPath = path.resolve(__dirname, '../../.env');
const envResult = loadEnv({ path: envPath });
const envVars = envResult.parsed ?? {};
const databaseUrl = envVars['DATABASE_URL'] ?? process.env.DATABASE_URL ?? '';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: databaseUrl,
  },
});
