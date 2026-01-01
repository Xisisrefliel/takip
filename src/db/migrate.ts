import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;

async function runMigrations() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for migrations");
  }

  const client = neon(databaseUrl);
  const db = drizzleNeon(client, { schema });
  await migrateNeon(db, { migrationsFolder: "./drizzle" });
}

runMigrations().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});

