/** Уведомление владельцу в Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_OWNER_CHAT). Без переменных — тихо пропускает. */
export async function notifyOwner(html: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_OWNER_CHAT;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: html, parse_mode: "HTML", link_preview_options: { is_disabled: true } }),
      cache: "no-store",
    });
  } catch (e) {
    console.error("notifyOwner:", e);
  }
}
