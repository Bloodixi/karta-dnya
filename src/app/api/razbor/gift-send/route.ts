import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { escapeHtml as h, notifyPayment } from "@/lib/notify";
import { dueGifts } from "@/lib/razborGift";
import { mailGift } from "@/lib/razborMail";

export const dynamic = "force-dynamic";

/** Секрет из заголовка X-Cron-Secret (или Authorization: Bearer …) сравниваем по хешу — без утечки длины и времени. */
function authorized(req: Request): boolean {
  const want = process.env.RAZBOR_CRON_SECRET;
  if (!want || want.length < 16) return false;
  const got = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = createHash("sha256").update(want).digest();
  const b = createHash("sha256").update(got).digest();
  return timingSafeEqual(a, b);
}

/** Один проход за раз: два одновременных вызова не пошлют письма дважды (внутри mailGift — своя защита по заказу). */
let running: Promise<{ due: number; sent: number; failed: number }> | null = null;

async function run() {
  const due = await dueGifts();
  let sent = 0;
  const failed: string[] = [];
  for (const o of due) {
    const r = await mailGift(o);
    if (r.sent) sent++;
    else failed.push(`${o.id} (${r.error ?? "ошибка"})`);
  }
  if (sent || failed.length) {
    await notifyPayment(
      [`<b>🎁 Подарочные письма: отправлено ${sent} из ${due.length}</b>`, ...failed.map((f) => `⚠️ Заказ ${h(f)} — повторю завтра`)].join("\n"),
      !failed.length,
    ).catch(() => {});
  }
  return { due: due.length, sent, failed: failed.length };
}

/**
 * Ежедневный вызов с сервера (таймер на VPS): письма получателям подарков, у которых наступила дата отправки
 * (send_at ≤ сегодня по Москве), заказ оплачен и не возвращён, письмо ещё не уходило. Повторный вызов безопасен.
 * В ответе только счётчики — без адресов и имён.
 */
export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    running ??= run().finally(() => {
      running = null;
    });
    return NextResponse.json({ ok: true, ...(await running) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("razbor gift-send:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
