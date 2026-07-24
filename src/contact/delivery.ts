const TELEGRAM_MESSAGE_LIMIT = 4_096;
const DELIVERY_TIMEOUT_MS = 6_000;

export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};

type DeliveryConfig = {
  telegramBotToken?: string;
  telegramChatId?: string;
  resendApiKey?: string;
  contactFromEmail?: string;
  contactToEmail?: string;
};

type DeliveryDependencies = {
  fetch?: typeof fetch;
  config?: DeliveryConfig;
};

export type DeliveryResult = {
  configured: boolean;
  delivered: boolean;
  channel?: "telegram" | "email";
};

type TelegramResponse = {
  ok?: boolean;
  error_code?: number;
};

function getConfig(): DeliveryConfig {
  return {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    resendApiKey: process.env.RESEND_API_KEY,
    contactFromEmail: process.env.CONTACT_FROM_EMAIL,
    contactToEmail: process.env.CONTACT_TO_EMAIL,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

function takeCharacters(characters: string[], limit: number) {
  let length = 0;
  let count = 0;

  while (count < characters.length && length + characters[count].length <= limit) {
    length += characters[count].length;
    count += 1;
  }

  return characters.splice(0, count).join("");
}

export function buildTelegramMessages(contact: ContactMessage) {
  const header = [
    "📨 Новое обращение с портфолио",
    "",
    `Имя: ${contact.name}`,
    `Email: ${contact.email}`,
    "",
    "Сообщение:",
    "",
  ].join("\n");
  const continuationHeader = "Продолжение сообщения:\n";
  const remaining = Array.from(contact.message);
  const messages = [
    `${header}${takeCharacters(remaining, TELEGRAM_MESSAGE_LIMIT - header.length)}`,
  ];

  while (remaining.length > 0) {
    messages.push(
      `${continuationHeader}${takeCharacters(
        remaining,
        TELEGRAM_MESSAGE_LIMIT - continuationHeader.length,
      )}`,
    );
  }

  return messages;
}

async function sendTelegram(
  contact: ContactMessage,
  config: DeliveryConfig,
  fetchImplementation: typeof fetch,
) {
  const token = config.telegramBotToken;
  const chatId = config.telegramChatId;
  if (!token || !chatId) return { configured: false, sent: false };

  for (const text of buildTelegramMessages(contact)) {
    try {
      const response = await fetchImplementation(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            link_preview_options: { is_disabled: true },
          }),
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
        },
      );
      const result = (await response.json().catch(() => ({}))) as TelegramResponse;

      if (!response.ok || result.ok !== true) {
        console.error("Telegram contact delivery failed.", {
          status: response.status,
          errorCode: result.error_code,
        });
        return { configured: true, sent: false };
      }
    } catch {
      console.error("Telegram contact delivery failed due to a network error.");
      return { configured: true, sent: false };
    }
  }

  return { configured: true, sent: true };
}

async function sendEmail(
  contact: ContactMessage,
  config: DeliveryConfig,
  fetchImplementation: typeof fetch,
) {
  const apiKey = config.resendApiKey;
  const from = config.contactFromEmail;
  const to = config.contactToEmail;
  if (!apiKey || !from || !to) return { configured: false, sent: false };

  try {
    const response = await fetchImplementation("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: contact.email,
        subject: `Portfolio contact: ${contact.name}`,
        text: `Name: ${contact.name}\nEmail: ${contact.email}\n\n${contact.message}`,
        html: [
          `<p><strong>Name:</strong> ${escapeHtml(contact.name)}</p>`,
          `<p><strong>Email:</strong> ${escapeHtml(contact.email)}</p>`,
          "<p><strong>Message:</strong></p>",
          `<p>${escapeHtml(contact.message).replace(/\n/g, "<br>")}</p>`,
        ].join(""),
      }),
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error("Contact email delivery failed.", {
        status: response.status,
        requestId: response.headers.get("x-request-id"),
      });
      return { configured: true, sent: false };
    }

    return { configured: true, sent: true };
  } catch {
    console.error("Contact email delivery failed due to a network error.");
    return { configured: true, sent: false };
  }
}

export async function deliverContact(
  contact: ContactMessage,
  dependencies: DeliveryDependencies = {},
): Promise<DeliveryResult> {
  const config = dependencies.config ?? getConfig();
  const fetchImplementation = dependencies.fetch ?? fetch;

  const telegram = await sendTelegram(contact, config, fetchImplementation);
  if (telegram.sent) return { configured: true, delivered: true, channel: "telegram" };

  const email = await sendEmail(contact, config, fetchImplementation);
  if (email.sent) return { configured: true, delivered: true, channel: "email" };

  return {
    configured: telegram.configured || email.configured,
    delivered: false,
  };
}
