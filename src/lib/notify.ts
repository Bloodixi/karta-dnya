/** Экранирование для parse_mode HTML: всё, что пришло от покупателя, пропускать через неё. */
export function escapeHtml(v: unknown): string {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

type TgTarget = { chat: string; thread?: number; silent?: boolean };

async function sendTelegram(html: string, t: TgTarget): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: t.chat,
        ...(t.thread ? { message_thread_id: t.thread } : {}),
        text: html,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        disable_notification: Boolean(t.silent),
      }),
      cache: "no-store",
    });
    if (!res.ok) console.error("telegram:", t.chat, res.status, (await res.text()).slice(0, 200));
    return res.ok;
  } catch (e) {
    console.error("telegram:", e);
    return false;
  }
}

/** Уведомление владельцу в Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_OWNER_CHAT). Без переменных — тихо пропускает. */
export async function notifyOwner(html: string, silent = false): Promise<void> {
  const chat = process.env.TELEGRAM_OWNER_CHAT;
  if (chat) await sendTelegram(html, { chat, silent });
}

/**
 * Оплаты — в тему «💳 Оплаты» группы доски (TELEGRAM_PAY_CHAT + TELEGRAM_PAY_THREAD);
 * если тема не задана или Telegram её не принял — в личку владельцу.
 */
export async function notifyPayment(html: string, silent = false): Promise<void> {
  const chat = process.env.TELEGRAM_PAY_CHAT;
  const thread = Number(process.env.TELEGRAM_PAY_THREAD) || undefined;
  if (chat && (await sendTelegram(html, { chat, thread, silent }))) return;
  await notifyOwner(html, silent);
}
