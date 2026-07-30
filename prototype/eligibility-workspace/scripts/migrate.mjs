import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sql = neon(process.env.DATABASE_URL);
for (const filename of ["001_performance_repository.sql", "002_notebook_workspace.sql", "003_library_source_registry.sql", "004_library_document_storage.sql", "005_current_texas_revision.sql", "006_lighthouse.sql", "007_notebook_grounded_workspace.sql"]) {
  const migration = await readFile(resolve(root, "migrations", filename), "utf8");
  const statements = migration.split(/;\s*(?:\n|$)/).map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  console.log(`Applied migrations/${filename}`);
}
