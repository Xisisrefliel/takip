import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = databaseUrl?.startsWith("postgres");
const sqlitePath =
  databaseUrl?.startsWith("file:")
    ? databaseUrl.replace(/^file:/, "")
    : databaseUrl || "./db.sqlite";

type DatabaseClient =
  | BetterSQLite3Database<typeof schema>
  | NeonHttpDatabase<typeof schema>;

// Only open the driver we actually need so Postgres deployments
// don't attempt to create a local SQLite file during build.
export const db: DatabaseClient = usePostgres
  ? drizzleNeon(neon(databaseUrl!), { schema })
  : drizzleSqlite(new Database(sqlitePath), { schema });

