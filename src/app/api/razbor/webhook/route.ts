import { NextResponse } from "next/server";
import { applyPayment, applyRefund } from "@/lib/razborOrder";
import { getPayment, getRefund } from "@/lib/yookassa";
import { isYookassaIp } from "@/lib/yookassaIp";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const EVENTS = new Set(["payment.succeeded", "payment.canceled", "refund.succeeded"]);

/** Запасной лимит: ЮKassa шлёт уведомления по одному на событие, 60 в минуту с адреса — с большим запасом. */
const byIp = rateLimit(60, 60_000);

/**
 * HTTP-уведомления ЮKassa. Принимаем только payment.succeeded / payment.canceled и refund.succeeded,
 * телу не доверяем: статус перепроверяем GET /v3/payments/{id} (возврат — GET /v3/refunds/{id}).
 * Повторные уведомления безопасны — заказ меняется и владелец получает сообщение только при первом переходе
 * статуса (razborStore.settleOrder / refundOrder).
 * Принимаем только с адресов ЮKassa (X-Real-IP ставит Traefik, снаружи его не подделать) — чужие получают 403
 * до разбора тела и без обращения к API.
 */
export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!isYookassaIp(ip)) return NextResponse.json({ ok: false }, { status: 403 });
  // 429 — ЮKassa повторит уведомление позже
  if (!byIp.take(ip)) return NextResponse.json({ ok: false }, { status: 429, headers: { "Retry-After": "60" } });
  let id = "";
  try {
    const body = await req.json().catch(() => null);
    if (!body || !EVENTS.has(body.event)) return NextResponse.json({ ok: true });
    id = String(body.object?.id ?? "");
    if (!id) return NextResponse.json({ ok: true });
    if (body.event === "refund.succeeded") {
      await applyRefund(await getRefund(id));
      return NextResponse.json({ ok: true });
    }
    const p = await getPayment(id);
    if (!p.metadata?.order) return NextResponse.json({ ok: true }); // чужой платёж магазина
    await applyPayment(p);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("razbor webhook:", id, e);
    // 500 — ЮKassa повторит уведомление позже
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
