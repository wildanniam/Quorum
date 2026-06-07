import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_DATABASE_URL = "file:./data/quorum.db";

type GlobalWithDatabase = typeof globalThis & {
  quorumDatabase?: Database.Database;
};

export function resolveDatabasePath(databaseUrl = process.env.DATABASE_URL) {
  const url = databaseUrl ?? DEFAULT_DATABASE_URL;

  if (!url.startsWith("file:")) {
    throw new Error("Quorum local DB client expects DATABASE_URL to start with file:");
  }

  return path.resolve(process.cwd(), url.replace(/^file:/, ""));
}

export function getDatabase() {
  const globalForDb = globalThis as GlobalWithDatabase;

  if (!globalForDb.quorumDatabase) {
    const databasePath = resolveDatabasePath();
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });

    const db = new Database(databasePath);
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");

    globalForDb.quorumDatabase = db;
  }

  return globalForDb.quorumDatabase;
}
