import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  db: PostgresJsDatabase<typeof schema> | undefined;
};

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const connection = postgres(process.env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  return drizzle(connection, { schema });
}

// Lazy — only connect when first accessed at runtime, not at build time
export const db: PostgresJsDatabase<typeof schema> = new Proxy(
  {} as PostgresJsDatabase<typeof schema>,
  {
    get(_, prop) {
      globalForDb.db ??= createDb();
      return (globalForDb.db as unknown as Record<string | symbol, unknown>)[prop];
    },
  }
);

export type Database = PostgresJsDatabase<typeof schema>;
