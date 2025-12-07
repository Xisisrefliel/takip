import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Postgres connection");
}

// Neon HTTP client for Postgres
const client = neon(databaseUrl);

export const db: NeonHttpDatabase<typeof schema> = drizzle(client, { schema });

