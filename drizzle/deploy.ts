import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const connectionString = process.env.DATABASE_URL!;

const sql = postgres(connectionString, {
  ssl: connectionString.includes("supabase") ? "require" : undefined,
  max: 1,
});

async function deploy() {
  console.log("Connecting to database...");

  const migrationFile = path.join(__dirname, "migrations/0000_nifty_longshot.sql");
  const migrationSql = fs.readFileSync(migrationFile, "utf-8");

  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Executing ${statements.length} statements...`);

  for (let i = 0; i < statements.length; i++) {
    try {
      await sql.unsafe(statements[i]);
      console.log(`  [${i + 1}/${statements.length}] OK`);
    } catch (err: any) {
      if (err.message?.includes("already exists")) {
        console.log(`  [${i + 1}/${statements.length}] SKIP (already exists)`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] ERROR: ${err.message}`);
      }
    }
  }

  console.log("\nSchema deployed successfully!");
  await sql.end();
}

deploy().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
