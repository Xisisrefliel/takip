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

export const db = usePostgres
  ? drizzleNeon(neon(databaseUrl!), { schema })
  : drizzleSqlite(new Database(sqlitePath), { schema });

