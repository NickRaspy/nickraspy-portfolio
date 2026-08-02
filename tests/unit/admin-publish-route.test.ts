import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { handleAdminPublish, type AdminPublishDependencies } from "@/src/content/admin-publish";
import { importPortfolioWorkbook } from "@/src/content/importer";
import type { PortfolioContent } from "@/src/content/types";

const workbookPath = path.resolve("outputs/portfolio-data/portfolio.xlsx");

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
    body: JSON.stringify({ content, sourceFilename: "portfolio.xlsx" }),
  });
}

function dependenciesThatMustNotWrite(): AdminPublishDependencies {
  return {
    hasDatabase: () => true,
    publishContent: async () => {
      throw new Error("Invalid content must not be published.");
    },
    revalidatePortfolio: () => {
      throw new Error("Invalid content must not revalidate the site.");
    },
  };
}

test("publishes validated content through explicit dependencies", async () => {
  const content = await validContent();
  let revalidated = false;
  const actor = { githubId: 123456, login: "unit-test-admin" };
  const response = await handleAdminPublish(publishRequest(content), actor, {
    hasDatabase: () => true,
    publishContent: async (published, checksum, sourceFilename, receivedActor) => {
      assert.deepEqual(published, content);
      assert.match(checksum, /^[a-f0-9]{64}$/);
      assert.equal(sourceFilename, "portfolio.xlsx");
      assert.deepEqual(receivedActor, actor);
      return "version-id";
    },
    revalidatePortfolio: () => { revalidated = true; },
  });
  const payload = await response.json() as { versionId?: string; checksum?: string };

  assert.equal(response.status, 200);
  assert.equal(payload.versionId, "version-id");
  assert.match(payload.checksum ?? "", /^[a-f0-9]{64}$/);
  assert.equal(revalidated, true);
});

test("rejects client-tampered JSON in the publish handler before database access", async () => {
  const content = structuredClone(await validContent());
  content.projects[0].categoryId = "injected-category";
  content.contacts[0].url = "file:///etc/passwd";

  const response = await handleAdminPublish(
    publishRequest(content),
    { githubId: 123456, login: "unit-test-admin" },
    dependenciesThatMustNotWrite(),
  );
  const payload = await response.json() as {
    error?: string;
    issues?: Array<{ field?: string }>;
  };

  assert.equal(response.status, 422);
  assert.equal(payload.error, "Content validation failed.");
  assert.ok(payload.issues?.some((issue) => issue.field === "/projects/0/categoryId"));
  assert.ok(payload.issues?.some((issue) => issue.field === "/contacts/0/url"));
});

test("rejects malformed JSON in the publish handler", async () => {
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

  const response = await handleAdminPublish(
    request,
    { githubId: 123456, login: "unit-test-admin" },
    dependenciesThatMustNotWrite(),
  );

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "Request body must be valid JSON." });
});
