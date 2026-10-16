import { NextResponse } from "next/server";
import { mailAccess } from "@/lib/razborMail";
import { paidGiftsByRecipient, paidOrdersByEmail, patchGift, patchOrder } from "@/lib/razborStore";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";

/** Один запрос на адрес в 10 минут, не больше 10 запросов в час с одного IP (в памяти; суточный потолок — ниже). */
const byEmail = rateLimit(1, 10 * 60_000);
const byIp = rateLimit(10, 3600_000);

function allowed(email: string, ip: string): boolean {
  if (!byEmail.check(email) || !byIp.check(ip)) return false;
  byEmail.take(email);
  byIp.take(ip);
  return true;
}

/** Не больше 3 писем на адрес за сутки. Время отправок хранится в файлах заказов — переживает перезапуск. */
const DAY = 24 * 3600_000;
const PER_DAY = 3;

async function sendAccess(email: string): Promise<void> {
  const bought = (await paidOrdersByEmail(email)).slice(0, 20);
  const ids = new Set(bought.map((o) => o.id));
  // подарки, которые уже пришли на этот адрес получателю (свои заказы покупателя не дублируем)
  const gifts = (await paidGiftsByRecipient(email)).filter((o) => !ids.has(o.id)).slice(0, 20);
  if (!bought.length && !gifts.length) return;
  const now = Date.now();
  // у получателя свой счётчик в подарке заказа: письма покупателю и получателю не расходуют лимит друг друга
  const sent = new Set([...bought.flatMap((o) => o.access_mail_at ?? []), ...gifts.flatMap((o) => o.gift?.access_mail_at ?? [])].filter((t) => now - Date.parse(t) < DAY));
  if (sent.size >= PER_DAY) return;
  // отметку ставим до отправки: сбой почты тоже расходует попытку, зато письма не уйдут сверх потолка
  const stamps = [...sent, new Date(now).toISOString()].sort().slice(-PER_DAY);
  for (const o of bought) await patchOrder(o.id, { access_mail_at: stamps });
  for (const o of gifts) await patchGift(o.id, { access_mail_at: stamps });
  await mailAccess(email, bought, gifts);
}

/**
 * «Потеряли ссылку?» — присылает ссылки на оплаченные разборы на e-mail из заказа, а также на подарки,
 * уже отправленные на этот адрес получателю.
 * Ответ всегда одинаковый, чтобы по нему нельзя было узнать, покупал ли человек что-то на сайте.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const done = NextResponse.redirect(new URL("/razbor?dostup=1#dostup", SITE.url), 303);
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email) || !allowed(email, clientIp(req))) return done;
  // поиск и письмо — в фоне: время ответа не должно зависеть от того, были ли покупки на этот адрес
  void sendAccess(email).catch((e) => console.error("razbor dostup:", e));
  return done;
}
