import assert from "node:assert/strict";
import test from "node:test";

import { handleAdminRollback } from "@/src/content/admin-rollback";

const actor = { githubId: 123456, login: "unit-test-admin" };

function rollbackRequest(body: string): Request {
  return new Request("http://localhost:3000/api/admin/rollback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

test("rolls back through explicit dependencies with the authenticated actor", async () => {
  let revalidated = false;
  const response = await handleAdminRollback(
    rollbackRequest(JSON.stringify({ versionId: "version-id" })),
    actor,
    {
      rollbackContent: async (versionId, receivedActor) => {
        assert.equal(versionId, "version-id");
        assert.deepEqual(receivedActor, actor);
      },
      revalidatePortfolio: () => { revalidated = true; },
    },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { versionId: "version-id" });
  assert.equal(revalidated, true);
});

test("rejects malformed or incomplete rollback requests before database access", async () => {
  const dependencies = {
    rollbackContent: async () => { throw new Error("Invalid request must not reach the database."); },
    revalidatePortfolio: () => { throw new Error("Invalid request must not revalidate the site."); },
  };

  const malformed = await handleAdminRollback(rollbackRequest("{"), actor, dependencies);
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: "Request body must be valid JSON." });

  const missing = await handleAdminRollback(rollbackRequest("{}"), actor, dependencies);
  assert.equal(missing.status, 400);
  assert.deepEqual(await missing.json(), { error: "versionId is required." });
});
