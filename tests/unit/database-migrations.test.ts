import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  applyDatabaseMigrations,
  type DatabaseMigration,
  loadDatabaseMigrations,
  pendingDatabaseMigrations,
} from "@/src/database/migrations";

function migration(version: string, sql: string, checksum = `${version}-checksum`): DatabaseMigration {
  return {
    version,
    order: Number.parseInt(version, 10),
    name: `migration_${version}`,
    filename: `${version}_migration.sql`,
    checksum,
    sql,
  };
}

test("loads numbered SQL migrations in version order and calculates checksums", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-migrations-"));
  try {
    await fs.writeFile(path.join(directory, "010_second.sql"), "select 10;\n", "utf8");
    await fs.writeFile(path.join(directory, "002_first.sql"), "select 2;\n", "utf8");

    const migrations = await loadDatabaseMigrations(directory);

    assert.deepEqual(migrations.map(({ version }) => version), ["002", "010"]);
    assert.match(migrations[0].checksum, /^[a-f0-9]{64}$/);
    assert.notEqual(migrations[0].checksum, migrations[1].checksum);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("rejects migration files that do not follow the numbered naming convention", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-migrations-"));
  try {
    await fs.writeFile(path.join(directory, "initial.sql"), "select 1;\n", "utf8");
    await assert.rejects(loadDatabaseMigrations(directory), /Expected NNN_description\.sql/);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("returns only unapplied migrations and rejects ledger drift", () => {
  const migrations = [migration("001", "select 1;"), migration("002", "select 2;")];

  assert.deepEqual(
    pendingDatabaseMigrations(migrations, [{ version: "001", checksum: "001-checksum" }]),
    [migrations[1]],
  );
  assert.throws(
    () => pendingDatabaseMigrations(migrations, [{ version: "001", checksum: "changed" }]),
    /has changed/,
  );
  assert.throws(
    () => pendingDatabaseMigrations(migrations, [{ version: "003", checksum: "unknown" }]),
    /is missing from database\/migrations/,
  );
  assert.throws(
    () => pendingDatabaseMigrations(migrations, [{ version: "002", checksum: "002-checksum" }]),
    /history is not contiguous/,
  );
});

test("records a migration only after its SQL succeeds", async () => {
  const migrations = [migration("001", "select 1;"), migration("002", "broken sql;")];
  const events: string[] = [];

  await assert.rejects(
    applyDatabaseMigrations(migrations, {
      executeSql: async (sql) => {
        events.push(`execute:${sql}`);
        if (sql === "broken sql;") throw new Error("migration failed");
      },
      recordApplied: async ({ version }) => {
        events.push(`record:${version}`);
      },
    }),
    /migration failed/,
  );

  assert.deepEqual(events, ["execute:select 1;", "record:001", "execute:broken sql;"]);
});
