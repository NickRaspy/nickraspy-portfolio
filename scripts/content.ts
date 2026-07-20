import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { importPortfolioWorkbook } from "../src/content/importer";
import { listContentVersions, migrateContentDatabase, publishContent, rollbackContent } from "../src/content/repository";

loadEnvConfig(process.cwd());

const command = process.argv[2] ?? "validate";
const workbookPath = path.resolve(process.argv[3] && !process.argv[3].startsWith("--") ? process.argv[3] : "outputs/portfolio-data/portfolio.xlsx");

async function loadWorkbook() {
  const result = await importPortfolioWorkbook(await fs.readFile(workbookPath));
  for (const issue of result.issues) {
    console.error(`[${issue.severity.toUpperCase()}] ${issue.sheet}${issue.row ? `:${issue.row}` : ""}${issue.field ? ` (${issue.field})` : ""}: ${issue.message}`);
  }
  if (!result.content || !result.checksum) {
    throw new Error(`Workbook validation failed with ${result.issues.length} issue(s).`);
  }
  console.log(`Validated ${result.summary.projects} projects, ${result.summary.locales} locales; checksum ${result.checksum.slice(0, 12)}.`);
  return result;
}

async function revalidateSite() {
  if (!process.env.REVALIDATE_URL || !process.env.REVALIDATE_SECRET) {
    console.log("Revalidation skipped: REVALIDATE_URL/REVALIDATE_SECRET are not configured.");
    return;
  }
  const response = await fetch(process.env.REVALIDATE_URL, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
  });
  if (!response.ok) throw new Error(`Revalidation failed: ${response.status} ${await response.text()}`);
}

async function main() {
  if (command === "validate") {
    await loadWorkbook();
  } else if (command === "migrate") {
    await migrateContentDatabase();
    console.log("Content database is ready.");
  } else if (command === "sync") {
    const result = await loadWorkbook();
    await migrateContentDatabase();
    const id = await publishContent(result.content!, result.checksum!, path.basename(workbookPath), "local-cli");
    await fs.mkdir(path.resolve("outputs/portfolio-data"), { recursive: true });
    await fs.writeFile(path.resolve("outputs/portfolio-data/latest.json"), JSON.stringify(result.content, null, 2) + "\n", "utf8");
    await revalidateSite();
    console.log(`Published content version ${id}.`);
  } else if (command === "history") {
    console.table(await listContentVersions(50));
  } else if (command === "rollback") {
    const versionId = process.argv[3];
    if (!versionId) throw new Error("Usage: npm run content:rollback -- <version-id>");
    await rollbackContent(versionId);
    await revalidateSite();
    console.log(`Rolled back to ${versionId}.`);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
