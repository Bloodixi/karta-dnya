import { NextResponse } from "next/server";
import { mailAccess } from "@/lib/razborMail";
import { paidOrdersByEmail } from "@/lib/razborStore";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";

/** Один запрос на адрес в 10 минут, не больше 10 запросов в час с одного IP. */
const byEmail = rateLimit(1, 10 * 60_000);
const byIp = rateLimit(10, 3600_000);

function allowed(email: string, ip: string): boolean {
  if (!byEmail.check(email) || !byIp.check(ip)) return false;
  byEmail.take(email);
  byIp.take(ip);
  return true;
}

/**
 * «Потеряли ссылку?» — присылает ссылки на оплаченные разборы на e-mail из заказа.
 * Ответ всегда одинаковый, чтобы по нему нельзя было узнать, покупал ли человек что-то на сайте.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const done = NextResponse.redirect(new URL("/razbor?dostup=1#dostup", SITE.url), 303);
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email) || !allowed(email, clientIp(req))) return done;
  // поиск и письмо — в фоне: время ответа не должно зависеть от того, были ли покупки на этот адрес
  void paidOrdersByEmail(email)
    .then((orders) => (orders.length ? mailAccess(email, orders.slice(0, 20)) : undefined))
    .catch((e) => console.error("razbor dostup:", e));
  return done;
}
