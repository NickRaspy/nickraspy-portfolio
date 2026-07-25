import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test, { afterEach } from "node:test";

import { POST } from "@/app/api/admin/publish/route";
import { importPortfolioWorkbook } from "@/src/content/importer";
import type { PortfolioContent } from "@/src/content/types";

const originalAdminDevBypass = process.env.ADMIN_DEV_BYPASS;
const originalDatabaseUrl = process.env.DATABASE_URL;
const workbookPath = path.resolve("outputs/portfolio-data/portfolio.xlsx");

afterEach(() => {
  if (originalAdminDevBypass === undefined) delete process.env.ADMIN_DEV_BYPASS;
  else process.env.ADMIN_DEV_BYPASS = originalAdminDevBypass;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

async function validContent(): Promise<PortfolioContent> {
  const result = await importPortfolioWorkbook(await fs.readFile(workbookPath));
  assert.ok(result.content);
  return result.content;
}

function publishRequest(content: PortfolioContent): Request {
  return new Request("http://localhost:3000/api/admin/publish", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: JSON.stringify({ content, sourceFilename: "tampered.xlsx" }),
  });
}

test("rejects client-tampered JSON at the publish route before database access", async () => {
  process.env.ADMIN_DEV_BYPASS = "true";
  process.env.DATABASE_URL = "postgres://must-not-connect.invalid/portfolio";
  const content = structuredClone(await validContent());
  content.projects[0].categoryId = "injected-category";
  content.contacts[0].url = "file:///etc/passwd";

  const response = await POST(publishRequest(content));
  const payload = await response.json() as {
    error?: string;
    issues?: Array<{ field?: string }>;
  };

  assert.equal(response.status, 422);
  assert.equal(payload.error, "Content validation failed.");
  assert.ok(payload.issues?.some((issue) => issue.field === "/projects/0/categoryId"));
  assert.ok(payload.issues?.some((issue) => issue.field === "/contacts/0/url"));
});

test("rejects malformed JSON at the publish route", async () => {
  process.env.ADMIN_DEV_BYPASS = "true";
  process.env.DATABASE_URL = "postgres://must-not-connect.invalid/portfolio";
  const request = new Request("http://localhost:3000/api/admin/publish", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
    },
    body: "{",
  });

  const response = await POST(request);

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Request body must be valid JSON." });
});
