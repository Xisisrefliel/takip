import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;
const usePostgres = databaseUrl?.startsWith("postgres");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: usePostgres ? "postgresql" : "sqlite",
  dbCredentials: usePostgres
    ? { url: databaseUrl! }
    : { url: databaseUrl || "./db.sqlite" },
});

