const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is missing from .env.local.");
  process.exitCode = 1;
} else {
  const request = async (method) => {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json();

    if (!response.ok || result.ok !== true) {
      throw new Error(
        `Telegram API ${method} failed (${result.error_code ?? response.status}): ${
          result.description ?? "unknown error"
        }`,
      );
    }

    return result.result;
  };

  try {
    const bot = await request("getMe");
    const updates = await request("getUpdates");
    const chats = new Map();

    for (const update of updates) {
      const chat =
        update.message?.chat ??
        update.edited_message?.chat ??
        update.channel_post?.chat ??
        update.edited_channel_post?.chat ??
        update.my_chat_member?.chat ??
        update.chat_member?.chat ??
        update.chat_join_request?.chat;

      if (chat) {
        chats.set(String(chat.id), {
          chatId: String(chat.id),
          type: chat.type,
          title: chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(" "),
          username: chat.username ? `@${chat.username}` : "",
        });
      }
    }

    console.log(`Bot: @${bot.username}`);
    if (chats.size === 0) {
      console.log(
        "No chats found. Open the bot in Telegram, press Start, send any message, then run this command again.",
      );
    } else {
      console.table([...chats.values()]);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Telegram API request failed.");
    process.exitCode = 1;
  }
}
