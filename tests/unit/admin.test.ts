import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { afterEach } from "node:test";

import {
  adminCookieDeletionOptions,
  isAllowedGitHubId,
  type AdminSession,
} from "@/src/auth/admin";
import { authorizeAdminMutation } from "@/src/auth/request";
import { validateAdminWorkbookFile } from "@/src/content/admin-import";

const originalAllowedIds = process.env.ADMIN_GITHUB_ID;
const authenticatedSession: AdminSession = {
  githubId: 90720459,
  login: "unit-test-admin",
  expiresAt: Date.now() + 60_000,
};
const readAuthenticatedSession = async () => authenticatedSession;

afterEach(() => {
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

test("expires __Host admin cookies with browser-required attributes", () => {
  const options = adminCookieDeletionOptions("__Host-aetheris_admin");

  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, 0);
  assert.equal(options.expires.getTime(), 0);
});

test("allows same-origin admin mutations for an authenticated session", async () => {
  const result = await authorizeAdminMutation(
    adminRequest("/api/admin/publish", { method: "POST" }),
    readAuthenticatedSession,
  );

  assert.equal("session" in result, true);
  if ("session" in result) assert.equal(result.session.login, authenticatedSession.login);
});

test("rejects admin mutations without an authenticated session", async () => {
  const result = await authorizeAdminMutation(
    adminRequest("/api/admin/publish", { method: "POST" }),
    async () => null,
  );

  assert.equal("error" in result, true);
  if ("error" in result) assert.equal(result.error.status, 401);
});

test("rejects cross-origin admin mutations even with an authenticated session", async () => {
  const result = await authorizeAdminMutation(
    adminRequest(
      "/api/admin/publish",
      { method: "POST" },
      "https://attacker.example",
    ),
    readAuthenticatedSession,
  );

  assert.equal("error" in result, true);
  if ("error" in result) assert.equal(result.error.status, 403);
});

test("rejects unsupported admin import files", async () => {
  const response = await validateAdminWorkbookFile(
    new File(["not an xlsx"], "portfolio.csv", { type: "text/csv" }),
  );

  assert.equal(response.status, 415);
});

test("validates the maintained workbook for the protected admin route", async () => {
  const workbook = await fs.readFile(path.resolve("outputs/portfolio-data/portfolio.xlsx"));
  const response = await validateAdminWorkbookFile(new File([workbook], "portfolio.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
