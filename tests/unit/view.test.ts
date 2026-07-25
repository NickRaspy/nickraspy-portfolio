import assert from "node:assert/strict";
import test from "node:test";

import fallbackContent from "@/content/fallback/portfolio.json";
import type { PortfolioContent } from "@/src/content/types";
import { createPortfolioView } from "@/src/content/view";

function contentFixture(): PortfolioContent {
  return structuredClone(fallbackContent) as PortfolioContent;
}

test("uses the requested supported locale", () => {
  const content = contentFixture();
  const view = createPortfolioView(content, "ru");

  assert.equal(view.locale, "ru");
  assert.equal(view.profile.role, content.profile.translations.ru.role);
  assert.equal(view.categories[0].name, content.categories[0].translations.ru.name);
});

test("falls back to the default locale for an unknown locale or a missing translation", () => {
  const content = contentFixture();
  delete content.projects[0].translations.ru;

  const unknownLocaleView = createPortfolioView(content, "de");
  const missingTranslationView = createPortfolioView(content, "ru");

  assert.equal(unknownLocaleView.locale, content.defaultLocale);
  assert.equal(unknownLocaleView.profile.role, content.profile.translations.en.role);
  assert.equal(
    missingTranslationView.projects[0].name,
    content.projects[0].translations.en.name,
  );
});

test("sorts visible data and excludes unpublished projects and hidden contacts", () => {
  const content = contentFixture();
  content.skills.reverse();
  content.projects.push({
    ...structuredClone(content.projects[0]),
    id: "draft-first",
    status: "draft",
    sortOrder: 0,
  });
  content.contacts.push({
    ...structuredClone(content.contacts[0]),
    id: "hidden",
    visible: false,
    sortOrder: 0,
  });

  const view = createPortfolioView(content, "en");

  assert.deepEqual(
    view.skills.map((skill) => skill.sortOrder),
    [...view.skills.map((skill) => skill.sortOrder)].sort((left, right) => left - right),
  );
  assert.equal(view.projects.some((project) => project.id === "draft-first"), false);
  assert.equal(view.contacts.some((contact) => contact.id === "hidden"), false);
});
