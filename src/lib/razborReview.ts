/** Отзывы о разборе: письмо через 7 дней после оплаты, подписанная ссылка на форму, счётчик покупок. Только сервер. */
import { createHmac, timingSafeEqual } from "node:crypto";
import { readJsonData } from "./content";
import { mailReviewAsk } from "./razborMail";
import { listOrders, patchOrder, type Order } from "./razborStore";
import { SITE } from "./site";

const DAY = 86400_000;

function secret(): string {
  const s = process.env.RAZBOR_SECRET;
  if (!s) throw new Error("RAZBOR_SECRET не задан");
  return s;
}

/** Подпись ссылки на форму отзыва: номер заказа известен только покупателю, подпись не даёт перебирать номера. */
export const reviewSig = (id: string) => createHmac("sha256", secret()).update(`review:${id}`).digest("base64url").slice(0, 22);

export function reviewSigOk(id: string, sig: string): boolean {
  const a = Buffer.from(reviewSig(id));
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const reviewUrl = (id: string) => `${SITE.url}/razbor/otzyv?o=${id}&s=${reviewSig(id)}`;

/** Кому пора написать: боевой оплаченный заказ с e-mail, 7–30 дней после оплаты, письмо ещё не уходило. */
export function reviewDue(o: Order, now = Date.now()): boolean {
  const age = now - Date.parse(o.paid_at);
  return o.status === "paid" && !o.test && Boolean(o.email) && !o.review_asked_at && !o.review && age >= 7 * DAY && age <= 30 * DAY;
}

/** Ежедневный проход (вместе с подарками): не больше 50 писем за раз, отметка до отправки — без повторов при сбое. */
export async function askReviews(): Promise<{ due: number; sent: number }> {
  const due = (await listOrders((o) => reviewDue(o))).slice(0, 50);
  let sent = 0;
  for (const o of due) {
    await patchOrder(o.id, { review_asked_at: new Date().toISOString() });
    if ((await mailReviewAsk(o, reviewUrl(o.id))).sent) sent++;
  }
  return { due: due.length, sent };
}

/** Опубликованные отзывы — вручную отобранные из присланных (с согласия автора). */
export type PublicReview = { name: string; stars: number; text: string; product?: string; date: string };
export const publicReviews = () => readJsonData<PublicReview[]>("razbor/reviews.json", []);

/** Счётчик оплаченных боевых заказов — кэш на час (каталог заказов читается целиком). */
let counted: { at: number; n: Promise<number> } | null = null;
export function paidCount(): Promise<number> {
  if (!counted || Date.now() - counted.at > 3600_000) {
    const n = listOrders((o) => (o.status === "paid" || o.status === "refunded") && !o.test).then((l) => l.filter((o) => o.status === "paid").length);
    counted = { at: Date.now(), n };
    n.catch(() => { if (counted?.n === n) counted = null; });
  }
  return counted.n;
}
