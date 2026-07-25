import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js?**", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `
        window.turnstile = {
          render: function (_container, options) {
            queueMicrotask(function () { options.callback("playwright-token"); });
            return "playwright-widget";
          },
          remove: function () {},
          reset: function () {}
        };
      `,
    });
  });
});

test("navigates projects correctly on desktop and mobile", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "SYS_PROFILE" })).toBeVisible();
  await page.getByRole("button", { name: "PROJ" }).click();
  await page.getByRole("button", { name: /CAT_WEB_CORE/ }).click();
  await page.getByRole("button", { name: /Project Alpha/ }).click();

  await expect(page.getByRole("heading", { name: "FILE_METADATA" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Project Alpha" })).toBeVisible();

  const backToProjects = page.getByRole("button", { name: "Back to projects" });
  if (testInfo.project.name === "mobile-chromium") {
    await expect(backToProjects).toBeVisible();
    await backToProjects.click();
    await expect(page.getByRole("button", { name: /Project Alpha/ })).toBeVisible();
    await page.getByRole("button", { name: "Back to sectors" }).click();
    await expect(page.getByRole("button", { name: /CAT_WEB_CORE/ })).toBeVisible();
  } else {
    await expect(backToProjects).toBeHidden();
  }

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  expect(hasHorizontalOverflow).toBe(false);
});

test("submits the contact form after Turnstile verification", async ({ page }) => {
  let submittedPayload: Record<string, unknown> | undefined;
  await page.route("**/api/contact", async (route) => {
    submittedPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "LINK" }).click();
  await page.getByPlaceholder("Enter name").fill("Playwright User");
  await page.getByPlaceholder("Enter email").fill("playwright@example.com");
  await page.getByPlaceholder(/Transmit message/).fill(
    "This message validates the complete contact form browser flow.",
  );

  const submit = page.getByRole("button", { name: "INITIATE_TRANSFER" });
  await expect(submit).toBeEnabled();
  await submit.click();

  await expect(page.getByText("TRANSFER_COMPLETE")).toBeVisible();
  expect(submittedPayload).toMatchObject({
    name: "Playwright User",
    email: "playwright@example.com",
    turnstileToken: "playwright-token",
  });
});
