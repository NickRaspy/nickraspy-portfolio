import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { afterEach } from "node:test";

import { POST as validateImport } from "@/app/api/admin/import/validate/route";
import { isAllowedGitHubId } from "@/src/auth/admin";
import { authorizeAdminMutation } from "@/src/auth/request";

const originalBypass = process.env.ADMIN_DEV_BYPASS;
const originalAllowedIds = process.env.ADMIN_GITHUB_ID;

afterEach(() => {
  if (originalBypass === undefined) delete process.env.ADMIN_DEV_BYPASS;
  else process.env.ADMIN_DEV_BYPASS = originalBypass;
  if (originalAllowedIds === undefined) delete process.env.ADMIN_GITHUB_ID;
  else process.env.ADMIN_GITHUB_ID = originalAllowedIds;
});

function adminRequest(
  pathname: string,
  init: RequestInit = {},
  origin = "http://localhost:3000",
) {
  const headers = new Headers(init.headers);
  headers.set("host", "localhost:3000");
  headers.set("origin", origin);
  headers.set("sec-fetch-site", "same-origin");
  return new Request(`http://localhost:3000${pathname}`, { ...init, headers });
}

test("matches GitHub administrators by immutable numeric id", () => {
  process.env.ADMIN_GITHUB_ID = "90720459, 42, invalid, -1";

  assert.equal(isAllowedGitHubId(90720459), true);
  assert.equal(isAllowedGitHubId(42), true);
  assert.equal(isAllowedGitHubId(7), false);
});

test("allows same-origin admin mutations with the local development bypass", async () => {
  process.env.ADMIN_DEV_BYPASS = "true";

  const result = await authorizeAdminMutation(adminRequest("/api/admin/publish", {
    method: "POST",
  }));

  assert.equal("session" in result, true);
  if ("session" in result) assert.equal(result.session.login, "local-dev");
});

test("rejects cross-origin admin mutations even with an authenticated session", async () => {
  process.env.ADMIN_DEV_BYPASS = "true";

  const result = await authorizeAdminMutation(adminRequest(
    "/api/admin/publish",
    { method: "POST" },
    "https://attacker.example",
  ));

  assert.equal("error" in result, true);
  if ("error" in result) assert.equal(result.error.status, 403);
});

test("rejects unsupported admin import files", async () => {
  process.env.ADMIN_DEV_BYPASS = "true";
  const form = new FormData();
  form.set("file", new File(["not an xlsx"], "portfolio.csv", { type: "text/csv" }));

  const response = await validateImport(adminRequest("/api/admin/import/validate", {
    method: "POST",
    body: form,
  }));

  assert.equal(response.status, 415);
});

test("validates the maintained workbook through the protected admin route", async () => {
  process.env.ADMIN_DEV_BYPASS = "true";
  const workbook = await fs.readFile(path.resolve("outputs/portfolio-data/portfolio.xlsx"));
  const form = new FormData();
  form.set("file", new File([workbook], "portfolio.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));

  const response = await validateImport(adminRequest("/api/admin/import/validate", {
    method: "POST",
    body: form,
  }));
  const payload = await response.json() as {
    checksum?: string;
    content?: unknown;
    sourceFilename?: string;
  };

  assert.equal(response.status, 200);
  assert.ok(payload.content);
  assert.match(payload.checksum ?? "", /^[a-f0-9]{64}$/);
  assert.equal(payload.sourceFilename, "portfolio.xlsx");
});
