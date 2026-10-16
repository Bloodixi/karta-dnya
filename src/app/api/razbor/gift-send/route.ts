import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { escapeHtml as h, notifyPayment } from "@/lib/notify";
import { dueGifts } from "@/lib/razborGift";
import { mailGift } from "@/lib/razborMail";
import { askReviews } from "@/lib/razborReview";

export const dynamic = "force-dynamic";

/** Один проход за раз: два одновременных вызова не пошлют письма дважды (внутри mailGift — своя защита по заказу). */
let running: Promise<{ due: number; sent: number; failed: number; reviews: number }> | null = null;

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
  // заодно — просьбы об отзыве (через 7 дней после оплаты): утром, вместе с подарками
  const reviews = await askReviews().catch((e) => (console.error("razbor reviews:", (e as Error).message), { due: 0, sent: 0 }));
  return { due: due.length, sent, failed: failed.length, reviews: reviews.sent };
}

/**
 * Ежедневный вызов с сервера (таймер на VPS): письма получателям подарков, у которых наступила дата отправки
 * (send_at ≤ сегодня по Москве), заказ оплачен и не возвращён, письмо ещё не уходило. Повторный вызов безопасен.
 * В ответе только счётчики — без адресов и имён.
 */
export async function POST(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ ok: false }, { status: 403 });
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
