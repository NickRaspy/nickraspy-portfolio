import assert from "node:assert/strict";
import test from "node:test";

import { buildTelegramMessages, deliverContact, type ContactMessage } from "./delivery";

const contact: ContactMessage = {
  name: "Test User",
  email: "test@example.com",
  message: "A sufficiently long contact message.",
};

test("Telegram is the primary delivery channel", async () => {
  const requests: string[] = [];
  const result = await deliverContact(contact, {
    config: {
      telegramBotToken: "bot-token",
      telegramChatId: "123",
      resendApiKey: "resend-key",
      contactFromEmail: "from@example.com",
      contactToEmail: "to@example.com",
    },
    fetch: async (input) => {
      requests.push(input.toString());
      return Response.json({ ok: true });
    },
  });

  assert.deepEqual(result, {
    configured: true,
    delivered: true,
    channel: "telegram",
  });
  assert.equal(requests.length, 1);
  assert.match(requests[0], /api\.telegram\.org/);
});

test("Resend is used when Telegram delivery fails", async () => {
  const requests: string[] = [];
  const result = await deliverContact(contact, {
    config: {
      telegramBotToken: "bot-token",
      telegramChatId: "123",
      resendApiKey: "resend-key",
      contactFromEmail: "from@example.com",
      contactToEmail: "to@example.com",
    },
    fetch: async (input) => {
      const url = input.toString();
      requests.push(url);
      if (url.includes("api.telegram.org")) {
        return Response.json({ ok: false, error_code: 400 }, { status: 400 });
      }
      return Response.json({ id: "email-id" });
    },
  });

  assert.deepEqual(result, {
    configured: true,
    delivered: true,
    channel: "email",
  });
  assert.equal(requests.length, 2);
  assert.match(requests[1], /api\.resend\.com/);
});

test("Delivery reports an unconfigured service when neither channel is available", async () => {
  let fetchCalled = false;
  const result = await deliverContact(contact, {
    config: {},
    fetch: async () => {
      fetchCalled = true;
      return Response.json({});
    },
  });

  assert.deepEqual(result, { configured: false, delivered: false });
  assert.equal(fetchCalled, false);
});

test("Long Telegram messages are split without breaking Unicode characters", () => {
  const longMessage = "🚀".repeat(4_500);
  const messages = buildTelegramMessages({ ...contact, message: longMessage });

  assert.ok(messages.length > 1);
  assert.ok(messages.every((message) => message.length <= 4_096));

  const firstHeader = buildTelegramMessages({ ...contact, message: "" })[0];
  const continuationHeader = "Продолжение сообщения:\n";
  const reconstructed = [
    messages[0].slice(firstHeader.length),
    ...messages.slice(1).map((message) => message.slice(continuationHeader.length)),
  ].join("");
  assert.equal(reconstructed, longMessage);
});
