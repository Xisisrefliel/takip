import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load env vars from .env/.env.local so drizzle-kit can read DATABASE_URL
loadEnvConfig(process.cwd());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for drizzle config");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
});

