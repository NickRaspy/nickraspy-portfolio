import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const migrationFilenamePattern = /^(\d{3,})_([a-z0-9][a-z0-9_-]*)\.sql$/;
const migrationLockName = "nickraspy-portfolio:schema-migrations";

export interface DatabaseMigration {
  version: string;
  order: number;
  name: string;
  filename: string;
  checksum: string;
  sql: string;
}

export interface AppliedMigration {
  version: string;
  checksum: string;
}

export interface MigrationRunResult {
  applied: DatabaseMigration[];
  skipped: number;
}

interface MigrationExecutor {
  executeSql: (sql: string) => Promise<void>;
  recordApplied: (migration: DatabaseMigration) => Promise<void>;
}

export async function loadDatabaseMigrations(directory: string): Promise<DatabaseMigration[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const sqlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".sql"));
  const invalidFilenames = sqlFiles
    .filter((entry) => !migrationFilenamePattern.test(entry.name))
    .map((entry) => entry.name);

  if (invalidFilenames.length > 0) {
    throw new Error(`Invalid migration filename(s): ${invalidFilenames.join(", ")}. Expected NNN_description.sql.`);
  }
  if (sqlFiles.length === 0) {
    throw new Error(`No SQL migrations found in ${directory}.`);
  }

  const migrations = await Promise.all(sqlFiles.map(async (entry) => {
    const match = migrationFilenamePattern.exec(entry.name);
    if (!match) throw new Error(`Invalid migration filename: ${entry.name}.`);
    const sql = await fs.readFile(path.join(directory, entry.name), "utf8");
    const order = Number.parseInt(match[1], 10);
    if (!Number.isSafeInteger(order)) throw new Error(`Migration version is too large: ${match[1]}.`);
    return {
      version: match[1],
      order,
      name: match[2],
      filename: entry.name,
      checksum: createHash("sha256").update(sql).digest("hex"),
      sql,
    } satisfies DatabaseMigration;
  }));

  migrations.sort((left, right) => left.order - right.order || left.filename.localeCompare(right.filename));
  const seenOrders = new Map<number, string>();
  for (const migration of migrations) {
    const existing = seenOrders.get(migration.order);
    if (existing) {
      throw new Error(`Duplicate migration version ${migration.version}: ${existing} and ${migration.filename}.`);
    }
    seenOrders.set(migration.order, migration.filename);
  }
  return migrations;
}

export function pendingDatabaseMigrations(
  migrations: DatabaseMigration[],
  appliedMigrations: AppliedMigration[],
): DatabaseMigration[] {
  const availableByVersion = new Map(migrations.map((migration) => [migration.version, migration]));
  const appliedByVersion = new Map(appliedMigrations.map((migration) => [migration.version, migration]));

  for (const applied of appliedMigrations) {
    const available = availableByVersion.get(applied.version);
    if (!available) {
      throw new Error(`Applied migration ${applied.version} is missing from database/migrations.`);
    }
    if (available.checksum !== applied.checksum) {
      throw new Error(`Applied migration ${available.filename} has changed. Create a new migration instead of editing it.`);
    }
  }

  let foundPendingMigration = false;
  for (const migration of migrations) {
    if (!appliedByVersion.has(migration.version)) {
      foundPendingMigration = true;
    } else if (foundPendingMigration) {
      throw new Error(
        `Applied migration ${migration.filename} appears after an unapplied migration. Migration history is not contiguous.`,
      );
    }
  }

  return migrations.filter((migration) => !appliedByVersion.has(migration.version));
}

export async function applyDatabaseMigrations(
  migrations: DatabaseMigration[],
  executor: MigrationExecutor,
): Promise<void> {
  for (const migration of migrations) {
    await executor.executeSql(migration.sql);
    await executor.recordApplied(migration);
  }
}

export async function runDatabaseMigrations(options: {
  databaseUrl: string;
  migrationsDirectory?: string;
}): Promise<MigrationRunResult> {
  if (!options.databaseUrl.trim()) throw new Error("DATABASE_URL is not configured.");
  const migrationsDirectory = options.migrationsDirectory ?? path.resolve("database/migrations");
  const migrations = await loadDatabaseMigrations(migrationsDirectory);
  const database = postgres(options.databaseUrl, { max: 1, prepare: false });

  try {
    return await database.begin(async (transaction) => {
      await transaction`select pg_advisory_xact_lock(hashtext(${migrationLockName}))`;
      await transaction`
        create table if not exists schema_migrations (
          version text primary key,
          name text not null,
          checksum text not null,
          applied_at timestamptz not null default now()
        )
      `;

      const appliedMigrations = await transaction<AppliedMigration[]>`
        select version, checksum
        from schema_migrations
        order by version
      `;
      const pending = pendingDatabaseMigrations(migrations, appliedMigrations);

      await applyDatabaseMigrations(pending, {
        executeSql: async (sql) => {
          await transaction.unsafe(sql);
        },
        recordApplied: async (migration) => {
          await transaction`
            insert into schema_migrations (version, name, checksum)
            values (${migration.version}, ${migration.name}, ${migration.checksum})
          `;
        },
      });

      return { applied: pending, skipped: migrations.length - pending.length };
    });
  } finally {
    await database.end({ timeout: 5 });
  }
}
