import path from "node:path";

import { expect, test } from "@playwright/test";

test("validates the workbook in the local admin console", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByText("LOCAL_BYPASS")).toHaveCount(1);
  await expect(page.getByText("NOT_CONFIGURED")).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(
    path.resolve("outputs/portfolio-data/portfolio.xlsx"),
  );

  await expect(page.getByText("IMPORT_PREVIEW")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "portfolio.xlsx", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "PUBLISH_VERSION" })).toBeDisabled();

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});
