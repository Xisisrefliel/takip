import { migrate as migrateSqlite } from "drizzle-orm/better-sqlite3/migrator";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = databaseUrl?.startsWith("postgres");
const sqlitePath =
  databaseUrl?.startsWith("file:")
    ? databaseUrl.replace(/^file:/, "")
    : databaseUrl || "./db.sqlite";

async function runMigrations() {
  if (usePostgres && databaseUrl) {
    const client = neon(databaseUrl);
    const db = drizzleNeon(client, { schema });
    await migrateNeon(db, { migrationsFolder: "./drizzle" });
    return;
  }

  const sqlite = new Database(sqlitePath);
  const db = drizzleSqlite(sqlite, { schema });
  migrateSqlite(db, { migrationsFolder: "./drizzle" });
  sqlite.close();
}

runMigrations().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});

