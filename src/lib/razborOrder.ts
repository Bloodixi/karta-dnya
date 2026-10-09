/** Заказ разбора поверх платежа ЮKassa: данные заказа живут в metadata платежа, базы нет. Только сервер. */
import { getPayment, recentPayments, type Payment } from "./yookassa";
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

/** Относительный путь к разбору оплаченного заказа (для redirect внутри сайта). */
export function razborPath(p: Payment): string | null {
  const i = inputFromPayment(p);
  return i ? `/razbor/r/${makeToken(i)}` : null;
}

export function razborUrl(p: Payment): string | null {
  const path = razborPath(p);
  return path ? `${SITE.url}${path}` : null;
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
