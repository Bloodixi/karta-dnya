/** Письмо покупателю после оплаты: ссылка на разбор и чек «Мой налог» (оферта, п. 4.3). Только сервер. */
import { mailReady, sendMail, type Inline } from "./mailer";
import { escapeHtml as h } from "./notify";
import { patchOrder, type Order } from "./razborStore";
import { SELLER, SITE } from "./site";

/** Картинка чека: ФНС рисует её не сразу после регистрации дохода — ждём до ~40 с, иначе письмо уйдёт со ссылкой. */
async function receiptImage(url: string): Promise<Buffer | null> {
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(url, { cache: "no-store" });
      if (r.ok && (r.headers.get("content-type") ?? "").startsWith("image/")) return Buffer.from(await r.arrayBuffer());
    } catch {}
    await new Promise((ok) => setTimeout(ok, 5000));
  }
  return null;
}

const msk = (iso: string) =>
  new Date(iso).toLocaleString("ru-RU", { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Отправляет письмо один раз на заказ (mail_sent_at). Ошибку не бросает — вернёт её текст для уведомления владельцу. */
export async function mailBuyer(order: Order): Promise<{ sent?: boolean; error?: string }> {
  if (order.mail_sent_at) return { sent: true };
  if (!order.email) return { error: "покупатель не указал e-mail" };
  if (!mailReady()) return { error: "не настроена отправка писем" };
  const url = `${SITE.url}/razbor/r/${order.token}`;
  const hello = order.name ? `${order.name}, здравствуйте!` : "Здравствуйте!";
  const img = order.receipt_url ? await receiptImage(order.receipt_url) : null;
  const inline: Inline[] = img ? [{ cid: "receipt@karta-dnya.ru", filename: `chek-${order.receipt_uuid}.png`, content: img, contentType: "image/png" }] : [];
  const paid = msk(order.paid_at || order.created_at);
  const receiptText = order.receipt_url
    ? [`Чек № ${order.receipt_uuid} от ${paid} (МСК), «Мой налог»:`, `Разбор по дате рождения — ${order.amount} ₽, безналичный расчёт.`, `Продавец: ${SELLER.name}, ИНН ${SELLER.inn}, налог на профессиональный доход.`, order.receipt_url, ""]
    : [];
  const text = [
    hello,
    "",
    "Спасибо за заказ. Ваш разбор по дате рождения готов и открывается по ссылке:",
    url,
    "",
    ...receiptText,
    `Заказ ${order.id}, ${order.amount} ₽.`,
    "Если ссылка не открывается или остались вопросы — просто ответьте на это письмо.",
    "",
    `${SITE.name} · ${SITE.url}`,
    `Продавец: ${SELLER.name}, ИНН ${SELLER.inn}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
<p>${h(hello)}</p>
<p>Спасибо за заказ. Ваш разбор по дате рождения готов:</p>
<p><a href="${h(url)}" style="display:inline-block;padding:10px 18px;background:#5b3fa8;color:#fff;border-radius:8px;text-decoration:none">Открыть разбор</a></p>
<p style="font-size:13px;color:#666">Ссылка: <a href="${h(url)}">${h(url)}</a></p>
${order.receipt_url ? `<div style="margin:20px 0;padding:16px;border:1px solid #e3e3e3;border-radius:10px">
<p style="margin:0 0 6px;font-weight:bold">Чек № ${h(order.receipt_uuid)} — «Мой налог»</p>
<p style="margin:0 0 10px;font-size:13px;color:#555">${h(paid)} (МСК) · Разбор по дате рождения · ${h(order.amount)} ₽ · безналичный расчёт<br>Продавец: ${h(SELLER.name)}, ИНН ${h(SELLER.inn)}, налог на профессиональный доход</p>
${img ? `<p style="margin:0 0 10px"><img src="cid:receipt@karta-dnya.ru" alt="Чек № ${h(order.receipt_uuid)}" width="320" style="max-width:100%;border:1px solid #eee"></p>` : ""}
<p style="margin:0;font-size:13px"><a href="${h(order.receipt_url)}">Открыть чек на сайте ФНС</a></p>
</div>` : ""}
<p>Заказ ${h(order.id)}, ${h(order.amount)} ₽.<br>Если ссылка не открывается или остались вопросы — просто ответьте на это письмо.</p>
<p style="font-size:12px;color:#888">${h(SITE.name)} · <a href="${h(SITE.url)}">${h(SITE.url.replace(/^https?:\/\//, ""))}</a><br>Продавец: ${h(SELLER.name)}, ИНН ${h(SELLER.inn)}</p>
</div>`;
  try {
    await sendMail({ to: order.email, subject: "Ваш разбор по дате рождения и чек", text, html, inline });
    await patchOrder(order.id, { mail_sent_at: new Date().toISOString() });
    return { sent: true };
  } catch (e) {
    console.error("razbor mail:", order.id, e);
    return { error: String((e as Error).message ?? e).slice(0, 200) };
  }
}
