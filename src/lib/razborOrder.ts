/**
 * Заказ разбора поверх платежа ЮKassa. Основная запись — файл заказа на томе (razborStore),
 * дубликат данных — в metadata платежа: по нему заказ восстанавливается, если файла нет. Только сервер.
 */
import { getPayment, recentPayments, type Payment } from "./yookassa";
import { getOrder, patchOrder, settleOrder, type Order } from "./razborStore";
import { escapeHtml as h, notifyPayment } from "./notify";
import { makeToken } from "./razborToken";
import { issueReceipt } from "./razborReceipt";
import { mailBuyer } from "./razborMail";
import type { RazborInput } from "./razbor";
import { SITE } from "./site";

export const PAY_COOKIE = "razbor_pay";

/** Последние соответствия заказ → платёж в памяти процесса (на случай, если cookie не дошла). */
const recent = new Map<string, string>();
export function rememberOrder(orderId: string, paymentId: string) {
  recent.set(orderId, paymentId);
  if (recent.size > 500) recent.delete(recent.keys().next().value!);
}

export function inputFromPayment(p: Payment): RazborInput | null {
  const md = p.metadata ?? {};
  const [y, m, d] = (md.date ?? "").split("-").map(Number);
  const yr = Number(md.yr);
  const mo = Number(md.mo);
  if (!y || !m || !d || !yr || !mo) return null;
  return { d, m, y, yr, mo, name: md.name || undefined };
}

/** Ищет платёж заказа: cookie → память процесса → платежи ЮKassa за сутки. */
export async function findPayment(orderId: string, cookiePaymentId?: string): Promise<Payment | null> {
  for (const id of [cookiePaymentId, recent.get(orderId)]) {
    if (!id) continue;
    try {
      const p = await getPayment(id);
      if (p.metadata?.order === orderId) return p;
    } catch {}
  }
  try {
    return (await recentPayments()).find((p) => p.metadata?.order === orderId) ?? null;
  } catch {
    return null;
  }
}

/** Заказ из metadata платежа — когда файла заказа нет. */
export function orderFromPayment(p: Payment): Order | null {
  const md = p.metadata ?? {};
  const i = inputFromPayment(p);
  if (!i || !md.order) return null;
  return {
    id: md.order, token: makeToken(i), date: md.date, name: md.name ?? "", email: md.email ?? "", amount: Number(p.amount.value),
    status: "pending", payment_id: p.id, created_at: p.created_at, paid_at: "", yr: i.yr, mo: i.mo,
  };
}

/**
 * После оплаты: чек «Мой налог» и письмо покупателю (каждое — один раз на заказ).
 * Возвращает строки для уведомления владельцу и заказ с обновлёнными полями.
 */
const finishing = new Map<string, Promise<{ order?: Order; lines: string[] }>>();
function finishPaid(order: Order): Promise<{ order?: Order; lines: string[] }> {
  // вебхук и страница «Спасибо» могут прийти одновременно — второй ждёт первый, чек не пробивается дважды
  const running = finishing.get(order.id);
  if (running) return running;
  const job = doFinishPaid(order).finally(() => finishing.delete(order.id));
  finishing.set(order.id, job);
  return job;
}

async function doFinishPaid(order: Order): Promise<{ order?: Order; lines: string[] }> {
  order = (await patchOrder(order.id, { receipt_due: true })) ?? { ...order, receipt_due: true };
  const r = await issueReceipt(order);
  const o = r.receipt ?? order;
  const m = await mailBuyer(o);
  const lines = [
    o.receipt_url ? `<a href="${h(o.receipt_url)}">Чек «Мой налог»</a>` : `<b>⚠️ Чек не пробит</b> (${h(r.error)}) — сайт повторит при следующем открытии заказа`,
    m.sent ? `✉️ Письмо отправлено на ${h(o.email)}` : `<b>⚠️ Письмо не отправлено</b> (${h(m.error)})`,
  ];
  return { order: o, lines };
}

const RETRY_GAP = 5 * 60_000;
const RETRY_MAX = 12;

/** Повтор для оплаченного заказа без чека или письма (сеть ФНС или почты была недоступна). Владельцу — что получилось. */
async function retryPaid(o: Order): Promise<Order> {
  if (!o.receipt_due || (o.receipt_uuid && (o.mail_sent_at || !o.email))) return o;
  // статус заказа открывается без входа: повторяем не чаще раза в 5 минут и не больше 12 раз,
  // чтобы при сбоях ФНС не наплодить чеков (ответ мог потеряться после регистрации дохода) и писем
  if ((o.retries ?? 0) >= RETRY_MAX || (o.retry_at && Date.now() - Date.parse(o.retry_at) < RETRY_GAP)) return o;
  o = (await patchOrder(o.id, { retry_at: new Date().toISOString(), retries: (o.retries ?? 0) + 1 })) ?? o;
  const before = { receipt: Boolean(o.receipt_uuid), mail: Boolean(o.mail_sent_at) };
  const f = await finishPaid(o);
  const after = f.order ?? o;
  const fresh = (await getOrder(o.id)) ?? after;
  if ((!before.receipt && fresh.receipt_uuid) || (!before.mail && fresh.mail_sent_at)) {
    await notifyPayment([`<b>↻ Заказ ${h(o.id)} доделан</b>`, ...f.lines].join("\n"), true);
  }
  return fresh;
}

/**
 * Сверяет заказ с уже перепроверенным в API платежом и, если статус стал итоговым, записывает его.
 * Уведомление владельцу уходит один раз — при первом переходе в paid (вебхук или страница «Спасибо», кто раньше).
 */
export async function applyPayment(p: Payment): Promise<Order | null> {
  const id = p.metadata?.order;
  if (!id) return null;
  if (p.status !== "succeeded" && p.status !== "canceled") return (await getOrder(id)) ?? orderFromPayment(p);
  const { order, changed } = await settleOrder(id, p.status === "succeeded" ? "paid" : "canceled", () => orderFromPayment(p), p.id);
  if (changed && order) {
    const test = p.test ? " · тест" : "";
    if (order.status === "paid") {
      const url = `${SITE.url}/razbor/r/${order.token}`;
      // тестовый магазин чек в налоговую не пробивает и письма не шлёт
      const f = p.test ? { lines: [] } : await finishPaid(order);
      await notifyPayment(
        [
          `<b>💳 Оплачен разбор — ${h(p.amount.value)} ₽</b>${test}`,
          "",
          `Дата рождения: ${h(order.date)}${order.name ? `\nИмя: ${h(order.name)}` : ""}${order.email ? `\nE-mail: ${h(order.email)}` : ""}`,
          "",
          `<a href="${h(url)}">Открыть разбор</a>`,
          ...f.lines,
          `<i>Заказ ${h(order.id)} · платёж ${h(p.id)}</i>`,
        ].join("\n"),
      );
    } else if (order.status === "canceled") {
      await notifyPayment(
        `<b>✖️ Оплата отменена — ${h(p.amount.value)} ₽</b>${test}\n<i>Заказ ${h(order.id)} · платёж ${h(p.id)}</i>`,
        true,
      );
    }
  }
  return order;
}

export type OrderState = { status: "unknown" | "pending" | "paid" | "canceled"; path?: string; receipt?: string };

/** Состояние заказа для страницы «Спасибо»: файл заказа, а пока он не итоговый — живой статус платежа в ЮKassa. */
export async function orderState(orderId: string, cookiePaymentId?: string): Promise<OrderState> {
  if (!orderId) return { status: "unknown" };
  let o = await getOrder(orderId);
  if (o?.status !== "paid") {
    let p: Payment | null = null;
    if (o?.payment_id) {
      try {
        p = await getPayment(o.payment_id);
      } catch (e) {
        console.error("razbor orderState:", orderId, e);
      }
    }
    if (!p) p = await findPayment(orderId, cookiePaymentId);
    if (p && p.metadata?.order === orderId) o = (await applyPayment(p)) ?? o;
  }
  if (!o) return { status: "unknown" };
  if (o.status !== "paid") return { status: o.status };
  if (!o.receipt_url) o = (await getOrder(o.id)) ?? o; // чек мог пробиться в вебхуке после первого чтения
  if (o.receipt_due && (!o.receipt_uuid || (o.email && !o.mail_sent_at))) o = await retryPaid(o).catch(() => o!);
  return { status: "paid", path: `/razbor/r/${o.token}`, receipt: o.receipt_url };
}
