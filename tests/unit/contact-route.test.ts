import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import { POST } from "@/app/api/contact/route";

const originalFetch = globalThis.fetch;
const environmentKeys = [
  "TURNSTILE_SECRET_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
] as const;
const originalEnvironment = Object.fromEntries(
  environmentKeys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of environmentKeys) {
    const value = originalEnvironment[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

function contactRequest(payload: Record<string, unknown>, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin,
    },
    body: JSON.stringify(payload),
  });
}

const validPayload = {
  name: "  Test   User  ",
  email: "TEST@EXAMPLE.COM",
  message: "A sufficiently long contact message.",
  website: "",
  turnstileToken: "turnstile-token",
};

test("rejects cross-origin form submissions before reading the payload", async () => {
  const response = await POST(contactRequest(validPayload, "https://attacker.example"));

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { ok: false, code: "FORBIDDEN" });
});

test("rejects invalid contact fields", async () => {
  const response = await POST(contactRequest({
    ...validPayload,
    email: "not-an-email",
    message: "short",
  }));

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, code: "INVALID_FIELDS" });
});

test("accepts the honeypot path without contacting external services", async () => {
  globalThis.fetch = (() => {
    throw new Error("fetch must not be called for honeypot submissions");
  }) as typeof fetch;

  const response = await POST(contactRequest({ ...validPayload, website: "bot.example" }));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
});

test("verifies Turnstile, normalizes fields, and delivers through Telegram", async () => {
  process.env.TURNSTILE_SECRET_KEY = "turnstile-secret";
  process.env.TELEGRAM_BOT_TOKEN = "bot-token";
  process.env.TELEGRAM_CHAT_ID = "123";
  const requests: string[] = [];
  let telegramPayload: { text?: string } | undefined;

  globalThis.fetch = (async (input, init) => {
    const url = input.toString();
    requests.push(url);
    if (url.includes("challenges.cloudflare.com")) {
      return Response.json({ success: true, action: "contact" });
    }
    telegramPayload = JSON.parse(String(init?.body)) as { text?: string };
    return Response.json({ ok: true });
  }) as typeof fetch;

  const response = await POST(contactRequest(validPayload));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(requests.length, 2);
  assert.match(requests[0], /challenges\.cloudflare\.com/);
  assert.match(requests[1], /api\.telegram\.org/);
  assert.match(telegramPayload?.text ?? "", /Test User/);
  assert.match(telegramPayload?.text ?? "", /test@example\.com/);
});
