import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = databaseUrl?.startsWith("postgres");
const sqlitePath =
  databaseUrl?.startsWith("file:")
    ? databaseUrl.replace(/^file:/, "")
    : databaseUrl || "./db.sqlite";

const sqliteDb = drizzleSqlite(new Database(sqlitePath), { schema });
const postgresDb = usePostgres ? drizzleNeon(neon(databaseUrl!), { schema }) : null;

// Keep the type aligned with our sqlite schema so select().from(...) works
export const db: BetterSQLite3Database<typeof schema> =
  (postgresDb as unknown as BetterSQLite3Database<typeof schema>) ?? sqliteDb;

