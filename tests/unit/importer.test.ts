import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

import {
  importPortfolioWorkbook,
  validatePortfolioContent,
  validatePortfolioContentForPublish,
} from "@/src/content/importer";
import type { PortfolioContent } from "@/src/content/types";

const workbookPath = path.resolve("outputs/portfolio-data/portfolio.xlsx");

function removeWorkbookSheet(workbook: Buffer, sheetName: string): Buffer {
  const archive = unzipSync(new Uint8Array(workbook));
  const workbookXmlPath = "xl/workbook.xml";
  const workbookXml = strFromU8(archive[workbookXmlPath]);
  const escapedName = sheetName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nextWorkbookXml = workbookXml.replace(
    new RegExp(`<x:sheet\\b(?=[^>]*\\bname="${escapedName}")[^>]*/>`),
    "",
  );

  assert.notEqual(nextWorkbookXml, workbookXml, `Sheet ${sheetName} must exist in the fixture.`);
  archive[workbookXmlPath] = strToU8(nextWorkbookXml);
  return Buffer.from(zipSync(archive, { level: 0 }));
}

async function validContent(): Promise<PortfolioContent> {
  const result = await importPortfolioWorkbook(await fs.readFile(workbookPath));
  assert.ok(result.content);
  return result.content;
}

test("imports the maintained portfolio workbook and returns a stable summary", async () => {
  const result = await importPortfolioWorkbook(await fs.readFile(workbookPath));

  assert.ok(result.content);
  assert.match(result.checksum ?? "", /^[a-f0-9]{64}$/);
  assert.deepEqual(result.issues, []);
  assert.deepEqual(result.summary, {
    locales: 2,
    categories: 3,
    projects: 4,
    skills: 3,
    experience: 2,
    contacts: 1,
  });
  assert.equal(result.content.defaultLocale, "en");
  assert.deepEqual(result.content.projects[0].technologies, ["React", "WebGL"]);
});

test("reports a missing required sheet instead of producing publishable content", async () => {
  const workbook = removeWorkbookSheet(await fs.readFile(workbookPath), "contacts");
  const result = await importPortfolioWorkbook(workbook);

  assert.equal(result.content, undefined);
  assert.equal(result.checksum, undefined);
  assert.ok(result.issues.some((issue) => issue.sheet === "contacts"));
});

test("rejects structurally invalid content before publication", async () => {
  const content = structuredClone(await validContent()) as Partial<PortfolioContent>;
  delete content.profile;

  const result = validatePortfolioContent(content);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some((issue) => issue.sheet === "schema"));
});

test("rejects unsafe external links before publication", async () => {
  const content = structuredClone(await validContent());
  content.projects[0].liveUrl = "javascript:alert(1)";
  content.contacts[0].url = "file:///etc/passwd";

  const result = validatePortfolioContentForPublish(content);

  assert.equal(result.valid, false);
  assert.equal(result.issues.filter((issue) => issue.sheet === "links").length, 2);
});
