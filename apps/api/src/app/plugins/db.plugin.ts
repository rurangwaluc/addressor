import fp from "fastify-plugin";
import { Pool } from "pg";
import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../db/schema/index.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

// Explicit type cast so TS sees all tables
export const db = drizzle(pool, { schema }) as NodePgDatabase<schema.Schema>;

export const dbPlugin = fp(async (fastify) => {
  fastify.decorate("db", db);
  fastify.decorate("pg", pool);

  fastify.addHook("onClose", async () => {
    await pool.end();
  });
});