import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "db", "migrations");

function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./data/quorum.db";

  if (!databaseUrl.startsWith("file:")) {
    throw new Error(
      "Local migration runner expects DATABASE_URL to use file:./path/to.db",
    );
  }

  return path.resolve(projectRoot, databaseUrl.replace(/^file:/, ""));
}

const databasePath = resolveDatabasePath();
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const applied = new Set(
  db
    .prepare("SELECT filename FROM schema_migrations ORDER BY filename")
    .all()
    .map((row) => row.filename),
);

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((filename) => filename.endsWith(".sql"))
  .sort();

const applyMigration = db.transaction((filename, sql) => {
  db.exec(sql);
  db.prepare("INSERT INTO schema_migrations (filename) VALUES (?)").run(filename);
});

const newlyApplied = [];

for (const filename of migrationFiles) {
  if (applied.has(filename)) continue;

  const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
  applyMigration(filename, sql);
  newlyApplied.push(filename);
}

console.log(
  JSON.stringify(
    {
      databasePath,
      applied: newlyApplied,
      totalMigrations: migrationFiles.length,
    },
    null,
    2,
  ),
);

db.close();
