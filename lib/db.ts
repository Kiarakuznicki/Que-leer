import { neon } from "@neondatabase/serverless";
import { config } from "./config";

let schema: Promise<void> | undefined;

async function createTables(): Promise<void> {
  const sql = neon(config.databaseUrl);
  await sql`CREATE TABLE IF NOT EXISTS results (
    id text PRIMARY KEY,
    data jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS counters (
    bucket text PRIMARY KEY,
    hits integer NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS availability_cache (
    key text PRIMARY KEY,
    data jsonb NOT NULL,
    fetched_at timestamptz NOT NULL DEFAULT now()
  )`;
}

function ensureSchema(): Promise<void> {
  schema ??= createTables().catch((error) => {
    schema = undefined;
    throw error;
  });
  return schema;
}

export async function saveResult(id: string, data: unknown): Promise<void> {
  await ensureSchema();
  const sql = neon(config.databaseUrl);
  await sql`INSERT INTO results (id, data) VALUES (${id}, ${JSON.stringify(data)}::jsonb)`;
}

export async function getResult<T>(id: string): Promise<T | null> {
  await ensureSchema();
  const sql = neon(config.databaseUrl);
  const rows = await sql`SELECT data FROM results WHERE id = ${id}`;
  return rows.length ? (rows[0].data as T) : null;
}

export async function bump(bucket: string): Promise<number> {
  await ensureSchema();
  const sql = neon(config.databaseUrl);
  const rows = await sql`
    INSERT INTO counters (bucket, hits) VALUES (${bucket}, 1)
    ON CONFLICT (bucket) DO UPDATE SET hits = counters.hits + 1
    RETURNING hits`;
  return Number(rows[0].hits);
}

export async function readCache<T>(key: string): Promise<T | null> {
  await ensureSchema();
  const sql = neon(config.databaseUrl);
  const rows = await sql`
    SELECT data FROM availability_cache
    WHERE key = ${key} AND fetched_at > now() - (${config.cacheHours}::float8 * interval '1 hour')`;
  return rows.length ? (rows[0].data as T) : null;
}

export async function writeCache(key: string, data: unknown): Promise<void> {
  await ensureSchema();
  const sql = neon(config.databaseUrl);
  await sql`
    INSERT INTO availability_cache (key, data) VALUES (${key}, ${JSON.stringify(data)}::jsonb)
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, fetched_at = now()`;
}
