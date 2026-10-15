/**
 * Заказ разбора поверх платежа ЮKassa. Основная запись — файл заказа на томе (razborStore),
 * дубликат данных — в metadata платежа: по нему заказ восстанавливается, если файла нет. Только сервер.
 */
import { getPayment, recentPayments, type Payment } from "./yookassa";
import { getOrder, settleOrder, type Order } from "./razborStore";
import { escapeHtml as h, notifyOwner } from "./notify";
import { makeToken } from "./razborToken";
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
 * Сверяет заказ с уже перепроверенным в API платежом и, если статус стал итоговым, записывает его.
 * Уведомление владельцу уходит один раз — при первом переходе в paid (вебхук или страница «Спасибо», кто раньше).
 */
export async function applyPayment(p: Payment): Promise<Order | null> {
  const id = p.metadata?.order;
  if (!id) return null;
  if (p.status !== "succeeded" && p.status !== "canceled") return (await getOrder(id)) ?? orderFromPayment(p);
  const { order, changed } = await settleOrder(id, p.status === "succeeded" ? "paid" : "canceled", () => orderFromPayment(p), p.id);
  if (changed && order?.status === "paid") {
    const url = `${SITE.url}/razbor/r/${order.token}`;
    await notifyOwner(
      `Оплачен разбор: ${h(p.amount.value)} ₽${p.test ? " (тест)" : ""}\nДата: ${h(order.date)}${order.name ? `, имя: ${h(order.name)}` : ""}${order.email ? `\nE-mail: ${h(order.email)}` : ""}\nЗаказ ${h(order.id)} · платёж ${h(p.id)}\n<a href="${h(url)}">Ссылка на разбор</a>`,
    );
  }
  return order;
}

export type OrderState = { status: "unknown" | "pending" | "paid" | "canceled"; path?: string };

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
  return o.status === "paid" ? { status: "paid", path: `/razbor/r/${o.token}` } : { status: o.status };
}
