import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, "../../../data");
const dbPath = path.join(dbDir, "workflows.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client);

export async function initDb() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      nodes TEXT NOT NULL,
      edges TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS executions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT NOT NULL REFERENCES workflows(id),
      status TEXT NOT NULL,
      triggered_at TEXT NOT NULL,
      completed_at TEXT,
      steps TEXT NOT NULL
    );
  `);
}
