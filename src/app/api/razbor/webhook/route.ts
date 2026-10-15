import { NextResponse } from "next/server";
import { applyPayment } from "@/lib/razborOrder";
import { getPayment } from "@/lib/yookassa";

const EVENTS = new Set(["payment.succeeded", "payment.canceled"]);

/**
 * HTTP-уведомления ЮKassa. Принимаем только payment.succeeded / payment.canceled, телу не доверяем:
 * статус перепроверяем GET /v3/payments/{id}. Повторные уведомления безопасны — заказ меняется и
 * владелец получает сообщение только при первом переходе статуса (razborStore.settleOrder).
 */
export async function POST(req: Request) {
  let id = "";
  try {
    const body = await req.json().catch(() => null);
    if (!body || !EVENTS.has(body.event)) return NextResponse.json({ ok: true });
    id = String(body.object?.id ?? "");
    if (!id) return NextResponse.json({ ok: true });
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
