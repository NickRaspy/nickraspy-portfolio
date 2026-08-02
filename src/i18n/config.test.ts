import assert from "node:assert/strict";
import test from "node:test";

import { detectPreferredLocale, isSupportedLocale } from "./config";

test("detects a supported locale from browser language preferences", () => {
  assert.equal(detectPreferredLocale("ru-RU,ru;q=0.9,en;q=0.8"), "ru");
  assert.equal(detectPreferredLocale("ru;q=0.6,en-US;q=0.9"), "en");
  assert.equal(detectPreferredLocale("de-DE,ru;q=0"), "en");
});

test("falls back to English when no supported browser language is present", () => {
  assert.equal(detectPreferredLocale("de-DE,de;q=0.9"), "en");
  assert.equal(detectPreferredLocale(null), "en");
});

test("accepts only public route locales", () => {
  assert.equal(isSupportedLocale("en"), true);
  assert.equal(isSupportedLocale("ru"), true);
  assert.equal(isSupportedLocale("de"), false);
});
