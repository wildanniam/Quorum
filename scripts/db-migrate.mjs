import fs from "node:fs";
import path from "node:path";
import {
  databaseUrl,
  redactDatabaseUrl,
  withClient,
  withTransaction,
} from "./postgres-utils.mjs";

const projectRoot = process.cwd();
const migrationsDir = path.join(projectRoot, "db", "migrations");

await withClient(
  async (client, { schema }) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const applied = new Set(
      (
        await client.query(
          "SELECT filename FROM schema_migrations ORDER BY filename",
        )
      ).rows.map((row) => row.filename),
    );

    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((filename) => filename.endsWith(".sql"))
      .sort();
    const newlyApplied = [];

    for (const filename of migrationFiles) {
      if (applied.has(filename)) continue;

      const sql = fs.readFileSync(path.join(migrationsDir, filename), "utf8");

      await withTransaction(client, async () => {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );
      });
      newlyApplied.push(filename);
    }

    console.log(
      JSON.stringify(
        {
          databaseUrl: redactDatabaseUrl(databaseUrl({ migration: true })),
          schema,
          applied: newlyApplied,
          totalMigrations: migrationFiles.length,
        },
        null,
        2,
      ),
    );
  },
  { migration: true },
);
