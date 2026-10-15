/** Письмо покупателю после оплаты: ссылка на разбор и чек «Мой налог» (оферта, п. 4.3). Только сервер. */
import { mailReady, sendMail, type Inline } from "./mailer";
import { escapeHtml as h } from "./notify";
import { patchOrder, type Order } from "./razborStore";
import { qrPng, receiptView } from "./receiptView";
import { SELLER, SITE } from "./site";

/** Отправляет письмо один раз на заказ (mail_sent_at). Ошибку не бросает — вернёт её текст для уведомления владельцу. */
export async function mailBuyer(order: Order): Promise<{ sent?: boolean; error?: string }> {
  if (order.mail_sent_at) return { sent: true };
  if (!order.email) return { error: "покупатель не указал e-mail" };
  if (!mailReady()) return { error: "не настроена отправка писем" };
  const url = `${SITE.url}/r/${order.id}`;
  const hello = order.name ? `${order.name}, здравствуйте!` : "Здравствуйте!";
  const r = receiptView(order);
  const inline: Inline[] = r ? [{ cid: "qr@karta-dnya.ru", filename: `chek-${r.number}.png`, content: await qrPng(r.fnsUrl), contentType: "image/png" }] : [];
  const receiptText = r
    ? [
        `Чек № ${r.number} от ${r.date} ${r.time} (МСК)`,
        `Продавец: ${r.seller}, ИНН ${r.inn}, режим НО: НПД`,
        `1. ${r.item} — ${r.amount}`,
        `Итого: ${r.amount}, безналичный расчёт`,
        `Чек: ${r.pageUrl}`,
        `Проверить на сайте ФНС: ${r.fnsUrl}`,
        "",
      ]
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
${r ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;max-width:400px;border:1px solid #e5e1d8;border-radius:12px;background:#fffdf8;font-size:14px;color:#222">
<tr><td style="padding:20px 22px">
<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#888">Кассовый чек · приход</div>
<div style="font-size:20px;font-weight:bold;margin-top:2px">Чек № ${h(r.number)}</div>
<div style="color:#777;margin-top:2px">${h(r.date)} · ${h(r.time)} (МСК)</div>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:14px">
<tr><td style="padding:2px 0;color:#777">Продавец</td><td style="padding:2px 0;text-align:right">${h(r.seller)}</td></tr>
<tr><td style="padding:2px 0;color:#777">ИНН</td><td style="padding:2px 0;text-align:right">${h(r.inn)}</td></tr>
<tr><td style="padding:2px 0;color:#777">Режим НО</td><td style="padding:2px 0;text-align:right">НПД</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:12px;border-top:1px dashed #ccc">
<tr><td style="padding:10px 0 2px">1. ${h(r.item)}</td><td style="padding:10px 0 2px;text-align:right;white-space:nowrap">${h(r.amount)}</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:10px;border-top:1px dashed #ccc">
<tr><td style="padding:10px 0 0;font-size:17px;font-weight:bold">Итого</td><td style="padding:10px 0 0;text-align:right;font-size:17px;font-weight:bold">${h(r.amount)}</td></tr>
<tr><td colspan="2" style="color:#777;padding-top:2px">Безналичный расчёт</td></tr>
</table>
<div style="text-align:center;margin-top:16px;border-top:1px dashed #ccc;padding-top:16px">
<img src="cid:qr@karta-dnya.ru" width="140" height="140" alt="QR-код чека ФНС">
<div style="font-size:13px;margin-top:6px"><a href="${h(r.pageUrl)}" style="color:#5b3fa8">Открыть чек</a> · <a href="${h(r.fnsUrl)}" style="color:#777">проверить на сайте ФНС</a></div>
</div>
</td></tr></table>` : ""}
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
