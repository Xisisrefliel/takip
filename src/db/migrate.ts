import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "./db.sqlite");
const db = drizzle(sqlite, { schema });
migrate(db, { migrationsFolder: "./drizzle" });

sqlite.close();

