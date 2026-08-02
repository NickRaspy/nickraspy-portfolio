import assert from "node:assert/strict";
import test from "node:test";
import { formatVersionTimestamp } from "./formatVersionTimestamp";

test("formats version timestamps deterministically in UTC", () => {
  assert.equal(
    formatVersionTimestamp("2026-08-02T22:12:58.000Z"),
    "02.08.2026, 22:12:58 UTC",
  );
});

test("marks invalid version timestamps without throwing", () => {
  assert.equal(formatVersionTimestamp("not-a-date"), "INVALID_DATE");
});
