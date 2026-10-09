import { NextResponse } from "next/server";
import { escapeHtml as h, notifyOwner } from "@/lib/notify";
import { razborUrl } from "@/lib/razborOrder";
import { getPayment } from "@/lib/yookassa";

const seen = new Set<string>();

/** HTTP-уведомления ЮKassa. Телу не доверяем: статус перепроверяем запросом к API. */
export async function POST(req: Request) {
  let id = "";
  try {
    const body = await req.json();
    if (body?.event !== "payment.succeeded") return NextResponse.json({ ok: true });
    id = String(body?.object?.id ?? "");
    if (!id || seen.has(id)) return NextResponse.json({ ok: true });
    const p = await getPayment(id);
    if (p.status !== "succeeded") return NextResponse.json({ ok: true });
    seen.add(id);
    const md = p.metadata ?? {};
    const url = razborUrl(p);
    await notifyOwner(
      `💰 Оплачен разбор: ${h(p.amount.value)} ₽\nДата: ${h(md.date)}${md.name ? `, имя: ${h(md.name)}` : ""}${md.email ? `\nE-mail: ${h(md.email)}` : ""}\nЗаказ ${h(md.order)} · платёж ${h(p.id)}${url ? `\n<a href="${h(url)}">Ссылка на разбор</a>` : ""}`,
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("razbor webhook:", id, e);
    // 500 — ЮKassa повторит уведомление позже
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
