import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { importPortfolioWorkbook } from "../src/content/importer";
import { closeContentDatabase, listContentVersions, publishContent, rollbackContent } from "../src/content/repository";

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

async function revalidateSite(): Promise<void> {
  if (!process.env.REVALIDATE_URL || !process.env.REVALIDATE_SECRET) {
    console.log("Revalidation skipped: REVALIDATE_URL/REVALIDATE_SECRET are not configured.");
    return;
  }
  try {
    const response = await fetch(process.env.REVALIDATE_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.REVALIDATE_SECRET}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
    console.log("Site cache revalidated.");
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`Content was saved, but site revalidation failed: ${reason}`);
    console.warn("Retry revalidation after checking REVALIDATE_URL, or publish once from the admin console.");
  }
}

async function main() {
  if (command === "validate") {
    await loadWorkbook();
  } else if (command === "sync") {
    const result = await loadWorkbook();
    const id = await publishContent(result.content!, result.checksum!, path.basename(workbookPath), "local-cli");
    await fs.mkdir(path.resolve("outputs/portfolio-data"), { recursive: true });
    await fs.writeFile(path.resolve("outputs/portfolio-data/latest.json"), JSON.stringify(result.content, null, 2) + "\n", "utf8");
    console.log(`Published content version ${id}.`);
    await revalidateSite();
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closeContentDatabase();
    } catch (error) {
      console.error("Failed to close the database connection.", error);
      process.exitCode = 1;
    }
  });
