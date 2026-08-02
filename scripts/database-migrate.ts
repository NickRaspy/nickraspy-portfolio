import { loadEnvConfig } from "@next/env";
import { runDatabaseMigrations } from "../src/database/migrations";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const result = await runDatabaseMigrations({ databaseUrl: process.env.DATABASE_URL ?? "" });
  for (const migration of result.applied) {
    console.log(`Applied ${migration.filename}.`);
  }
  console.log(`Database migrations complete: ${result.applied.length} applied, ${result.skipped} already applied.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
