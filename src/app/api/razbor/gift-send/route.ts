import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { escapeHtml as h, notifyPayment } from "@/lib/notify";
import { dueGifts, dueGivers, dueYearly } from "@/lib/razborGift";
import { mailGift, mailGiftDelivered, mailYearly } from "@/lib/razborMail";
import { askReviews } from "@/lib/razborReview";
import { getOrder, patchOrder } from "@/lib/razborStore";

export const dynamic = "force-dynamic";

type Result = { due: number; sent: number; failed: number; givers: number; yearly: number; reviews: number };

/** Один проход за раз: два одновременных вызова не пошлют письма дважды (внутри mailGift — своя защита по заказу). */
let running: Promise<Result> | null = null;

/** Письма покупателям «Подарок доставлен» — после отложенных подарков (этого прохода и неудачных прошлых, до 3 дней). */
async function givers(): Promise<number> {
  let sent = 0;
  for (const o of await dueGivers()) {
    const fresh = (await getOrder(o.id)) ?? o;
    if ((await mailGiftDelivered(fresh)).sent) sent++;
  }
  return sent;
}

/** «Прогноз на следующий год»: отметка до отправки — при сбое почты письмо не повторится (одно письмо, не больше). */
async function yearly(): Promise<number> {
  let sent = 0;
  for (const o of (await dueYearly()).slice(0, 50)) {
    await patchOrder(o.id, { yearly_sent_at: new Date().toISOString() });
    if ((await mailYearly(o)).sent) sent++;
  }
  return sent;
}

async function run(): Promise<Result> {
  const due = await dueGifts();
  let sent = 0;
  const failed: string[] = [];
  for (const o of due) {
    const r = await mailGift(o);
    if (r.sent) sent++;
    else failed.push(`${o.id} (${r.error ?? "ошибка"})`);
  }
  const g = await givers().catch((e) => (console.error("razbor givers:", (e as Error).message), 0));
  const y = await yearly().catch((e) => (console.error("razbor yearly:", (e as Error).message), 0));
  if (sent || failed.length || y) {
    await notifyPayment(
      [
        `<b>🎁 Подарочные письма: отправлено ${sent} из ${due.length}</b>${g ? ` · дарителям «доставлен»: ${g}` : ""}`,
        ...failed.map((f) => `⚠️ Заказ ${h(f)} — повторю завтра`),
        ...(y ? [`📅 Писем «Прогноз на следующий год»: ${y}`] : []),
      ].join("\n"),
      !failed.length,
    ).catch(() => {});
  }
  // заодно — просьбы об отзыве (через 7 дней после оплаты): утром, вместе с подарками
  const reviews = await askReviews().catch((e) => (console.error("razbor reviews:", (e as Error).message), { due: 0, sent: 0 }));
  return { due: due.length, sent, failed: failed.length, givers: g, yearly: y, reviews: reviews.sent };
}

/**
 * Ежедневный вызов с сервера (таймер на VPS, 09:00 МСК): письма получателям подарков, у которых наступила дата
 * отправки (send_at ≤ сегодня по Москве), заказ оплачен и не возвращён, письмо ещё не уходило; затем покупателям
 * отложенных подарков — «Подарок доставлен», и по согласию — «Прогноз на следующий год» через 11 месяцев после оплаты.
 * Повторный вызов безопасен. В ответе только счётчики — без адресов и имён.
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
