/**
 * Письмо о брошенной оплате: заказ создан, e-mail есть, а через час оплата так и не прошла (платёж ждёт или отменён).
 * Одно спокойное письмо со ссылкой на форму, заполненную из заказа (resumePath). Запускается из фонового повтора
 * retryStuck (таймер раз в 15 минут). Один раз на заказ (abandon_mail_at); тестовые заказы — с [ТЕСТ] в теме.
 * Не пишем, если по этому адресу за сутки уже оплачен тот же продукт или после этого заказа был новый —
 * тогда письмо получит (или не получит) только последний. Только сервер.
 */
import { mailReady, sendMail } from "./mailer";
import { escapeHtml as h } from "./notify";
import { PRODUCTS, productOf, type Product } from "./razborProducts";
import { resumePath } from "./razborResume";
import { listOrders, patchOrder, type Order } from "./razborStore";
import { SITE } from "./site";
import { getPayment, type Payment } from "./yookassa";

/** Окно после создания заказа: раньше часа покупатель может ещё платить, позже трёх часов письмо уже не к месту. */
const FROM = 60 * 60_000;
const TO = 3 * 60 * 60_000;
const DAY = 86400_000;

/** Один и тот же продукт для правила «уже купил»: пакет закрывает и разбор, и совместимость (и наоборот). */
function same(a: Product, b: Product): boolean {
  if (a === b) return true;
  const pack = (x: Product, y: Product) => x === "pack" && (y === "razbor" || y === "compat");
  return pack(a, b) || pack(b, a);
}

const mail = (o: Order) => o.email.trim().toLowerCase();

/** Что оформляли — для текста письма. */
const WHAT: Record<Product, string> = {
  razbor: "разбор по дате рождения",
  compat: "совместимость пары",
  pack: "разбор по дате рождения вместе с совместимостью пары",
  child: "детский разбор",
  cert: "подарочный сертификат на разбор",
};

async function send(o: Order): Promise<void> {
  const product = productOf(o.product);
  const what = o.gift && product === "razbor" ? "разбор по дате рождения в подарок" : WHAT[product];
  const url = `${SITE.url}${resumePath(o)}`;
  const subject = `${o.test ? "[ТЕСТ] " : ""}Оплата не завершилась — ${PRODUCTS[product].short.toLowerCase()}`;
  const text = [
    "Здравствуй!",
    "",
    `Ты оформлял(а) на «${SITE.name}» ${what}, но оплата не завершилась.`,
    "Бесплатная часть и форма с твоими данными — здесь:",
    url,
    "",
    "Если ты передумал(а) или уже оплатил(а) другим заказом — просто не обращай внимания на это письмо. Напоминать больше не будем.",
    "",
    `${SITE.name} · ${SITE.url}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#222;max-width:560px">
<p>Здравствуй!</p>
<p>Ты оформлял(а) на «${h(SITE.name)}» ${h(what)}, но оплата не завершилась.</p>
<p>Бесплатная часть и форма с твоими данными — здесь:</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#5b3fa8" style="background:#5b3fa8;border-radius:8px;border:1px solid #5b3fa8"><a href="${h(url)}" target="_blank" style="display:inline-block;padding:11px 20px;font-family:Arial,sans-serif;font-size:15px;color:#ffffff;text-decoration:none;font-weight:bold">Вернуться к оплате</a></td></tr></table>
<p style="font-size:14px;color:#555">Если ты передумал(а) или уже оплатил(а) другим заказом — просто не обращай внимания на это письмо. Напоминать больше не будем.</p>
<p style="font-size:12px;color:#888">${h(SITE.name)} · ${h(SITE.url.replace(/^https?:\/\//, ""))}</p></div>`;
  await sendMail({ to: o.email, subject, text, html });
}

/**
 * Перебирает неоплаченные заказы в окне 1–3 часа и шлёт письмо тем, кто подходит. Перед письмом статус платежа
 * перечитывается в ЮKassa: оплаченный (вебхук мог потеряться) уходит в `settle` — обычное оформление оплаты.
 * Возвращает число отправленных писем.
 */
export async function remindAbandoned(settle: (p: Payment) => Promise<unknown>): Promise<number> {
  if (!mailReady()) return 0;
  const now = Date.now();
  const all = await listOrders((o) => Boolean(o.email) && now - Date.parse(o.created_at) < 2 * DAY);
  const due = all.filter((o) => {
    const age = now - Date.parse(o.created_at);
    return (o.status === "pending" || o.status === "canceled") && !o.abandon_mail_at && Boolean(o.payment_id) && age >= FROM && age <= TO;
  });
  let sent = 0;
  for (const o of due) {
    const product = productOf(o.product);
    const peers = all.filter((x) => x.id !== o.id && mail(x) === mail(o) && same(productOf(x.product), product));
    // уже оплачен тот же продукт за сутки, был заказ новее или по этому адресу уже писали о брошенной оплате
    const paid = peers.some((x) => (x.status === "paid" || x.status === "refunded") && now - Date.parse(x.paid_at || x.created_at) < DAY);
    const newer = peers.some((x) => Date.parse(x.created_at) > Date.parse(o.created_at));
    const told = peers.some((x) => x.abandon_mail_at && now - Date.parse(x.abandon_mail_at) < DAY);
    if (paid || newer || told) continue;
    let p: Payment;
    try {
      p = await getPayment(o.payment_id);
    } catch (e) {
      console.error("razbor abandon: платёж не прочитан", o.id, e instanceof Error ? e.message : "error");
      continue; // повторим через 15 минут, пока заказ в окне
    }
    if (p.metadata?.order !== o.id) continue;
    if (p.status === "succeeded" || p.status === "waiting_for_capture") {
      await settle(p).catch((e) => console.error("razbor abandon: оплата не оформлена", o.id, e instanceof Error ? e.message : "error"));
      continue;
    }
    if (p.status === "canceled") await settle(p).catch(() => {});
    // отметка до отправки: письмо уходит не больше одного раза, даже если отправка оборвётся на полпути
    const marked = await patchOrder(o.id, { abandon_mail_at: new Date().toISOString() });
    if (!marked || marked.status === "paid" || marked.status === "refunded") continue;
    try {
      await send(marked);
      sent++;
    } catch (e) {
      console.error("razbor abandon mail:", o.id, e instanceof Error ? e.message : "error");
    }
  }
  return sent;
}
