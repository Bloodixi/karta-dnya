/** Письмо покупателю после оплаты: ссылка на разбор и чек «Мой налог» (оферта, п. 4.3). Только сервер. */
import { mailReady, sendMail } from "./mailer";
import { escapeHtml as h } from "./notify";
import { patchOrder, type Order } from "./razborStore";
import { SELLER, SITE } from "./site";

/** Отправляет письмо один раз на заказ (mail_sent_at). Ошибку не бросает — вернёт её текст для уведомления владельцу. */
export async function mailBuyer(order: Order): Promise<{ sent?: boolean; error?: string }> {
  if (order.mail_sent_at) return { sent: true };
  if (!order.email) return { error: "покупатель не указал e-mail" };
  if (!mailReady()) return { error: "не настроена отправка писем" };
  const url = `${SITE.url}/razbor/r/${order.token}`;
  const hello = order.name ? `${order.name}, здравствуйте!` : "Здравствуйте!";
  const text = [
    hello,
    "",
    "Спасибо за заказ. Ваш разбор по дате рождения готов и открывается по ссылке:",
    url,
    "",
    ...(order.receipt_url ? ["Чек об оплате в «Мой налог»:", order.receipt_url, ""] : []),
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
${order.receipt_url ? `<p>Чек об оплате: <a href="${h(order.receipt_url)}">открыть в «Мой налог»</a></p>` : ""}
<p>Заказ ${h(order.id)}, ${h(order.amount)} ₽.<br>Если ссылка не открывается или остались вопросы — просто ответьте на это письмо.</p>
<p style="font-size:12px;color:#888">${h(SITE.name)} · <a href="${h(SITE.url)}">${h(SITE.url.replace(/^https?:\/\//, ""))}</a><br>Продавец: ${h(SELLER.name)}, ИНН ${h(SELLER.inn)}</p>
</div>`;
  try {
    await sendMail({ to: order.email, subject: "Ваш разбор по дате рождения и чек", text, html });
    await patchOrder(order.id, { mail_sent_at: new Date().toISOString() });
    return { sent: true };
  } catch (e) {
    console.error("razbor mail:", order.id, e);
    return { error: String((e as Error).message ?? e).slice(0, 200) };
  }
}
