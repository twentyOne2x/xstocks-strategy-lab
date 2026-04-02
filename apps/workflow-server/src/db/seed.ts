import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { workflows } from "./schema.js";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(__dirname, "../../data");
const dbPath = path.join(dbDir, "workflows.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

const now = new Date().toISOString();

await db.insert(workflows).values({
  id: crypto.randomUUID(),
  name: "My First Workflow",
  description: "An example workflow",
  nodes: JSON.stringify([]),
  edges: JSON.stringify([]),
  isActive: false,
  createdAt: now,
  updatedAt: now,
});

console.log("Seed complete");
sqlite.close();
