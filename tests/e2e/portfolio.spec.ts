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

test("detects the browser language and persists an explicit override", async ({ browser }, testInfo) => {
  const isMobile = testInfo.project.name === "mobile-chromium";
  const context = await browser.newContext({
    baseURL: testInfo.project.use.baseURL as string,
    locale: "ru-RU",
    viewport: isMobile ? { width: 412, height: 915 } : { width: 1440, height: 900 },
    hasTouch: isMobile,
    isMobile,
  });
  const page = await context.newPage();
  await page.goto("/");

  await expect(page).toHaveURL(/\/ru$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page).toHaveTitle("Aetheris // Портфолио Nickraspy");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Голографическое портфолио full-stack разработчика.",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/ru$/);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/opengraph-image/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
    "content",
    /\/twitter-image/,
  );
  const structuredData = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}",
  ) as { "@graph"?: Array<{ "@type"?: string }> };
  expect(structuredData["@graph"]?.some((node) => node["@type"] === "Person")).toBe(true);
  expect(structuredData["@graph"]?.some((node) => node["@type"] === "CreativeWork")).toBe(true);
  await expect(page.getByRole("heading", { name: "СИСТЕМНЫЙ_ПРОФИЛЬ" })).toBeVisible();
  const languageTargets = await page.locator(".language-switcher a").evaluateAll((links) =>
    links.map((link) => ({ width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height })),
  );
  assertLanguageTargets(languageTargets);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);

  await page.getByRole("link", { name: "Английский" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.goto("/");
  await expect(page).toHaveURL(/\/en$/);
  await context.close();
});

test("serves crawler directives, sitemap and messenger preview images", async ({ request }, testInfo) => {
  const siteUrl = String(testInfo.project.use.baseURL);
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBe(true);
  const robotsBody = await robotsResponse.text();
  expect(robotsBody).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
  expect(robotsBody).not.toContain("nickraspy.dev");

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemapBody = await sitemapResponse.text();
  expect(sitemapBody).toContain(`${siteUrl}/en`);
  expect(sitemapBody).toContain(`${siteUrl}/ru`);
  expect(sitemapBody).not.toContain("nickraspy.dev");

  for (const path of ["/opengraph-image", "/twitter-image", "/apple-icon"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    expect((await response.body()).byteLength).toBeGreaterThan(1_000);
  }
});

function assertLanguageTargets(targets: Array<{ width: number; height: number }>) {
  expect(targets).toHaveLength(2);
  for (const target of targets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
}

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

test("shows the fallback and rebuilds the renderer after WebGL context loss", async ({ page }) => {
  await page.goto("/");

  const canvas = page.locator(".space-background");
  await expect(canvas).toHaveAttribute("data-webgl-state", "ready");
  const supportsContextLoss = await canvas.evaluate((element) => {
    const extension = (element as HTMLCanvasElement).getContext("webgl")?.getExtension("WEBGL_lose_context");
    (element as HTMLCanvasElement & { recoveryExtension?: typeof extension }).recoveryExtension = extension;
    return Boolean(extension);
  });
  test.skip(!supportsContextLoss, "WEBGL_lose_context is unavailable in this browser");

  await canvas.evaluate((element) => {
    (element as HTMLCanvasElement & { recoveryExtension: WEBGL_lose_context }).recoveryExtension.loseContext();
  });
  await expect(canvas).toHaveAttribute("data-webgl-state", "fallback");
  await expect(canvas).toHaveCSS("opacity", "0");

  await canvas.evaluate((element) => {
    (element as HTMLCanvasElement & { recoveryExtension: WEBGL_lose_context }).recoveryExtension.restoreContext();
  });
  await expect(canvas).toHaveAttribute("data-webgl-state", "ready");
  await expect(canvas).toHaveCSS("opacity", "1");
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
