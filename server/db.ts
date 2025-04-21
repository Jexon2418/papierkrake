import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import config from './config';

neonConfig.webSocketConstructor = ws;

if (!config.database.connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log(`Connecting to database: ${config.database.name} (${config.environment} environment)`);

export const pool = new Pool({ 
  connectionString: config.database.connectionString,
});

export const db = drizzle({ client: pool, schema });
