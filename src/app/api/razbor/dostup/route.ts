import { NextResponse } from "next/server";
import { mailAccess } from "@/lib/razborMail";
import { paidOrdersByEmail } from "@/lib/razborStore";
import { SITE } from "@/lib/site";

/** Ограничения в памяти процесса: один запрос на адрес в 10 минут, не больше 10 запросов в час с одного IP. */
const byEmail = new Map<string, number>();
const byIp = new Map<string, number[]>();
const EMAIL_GAP = 10 * 60_000;
const IP_LIMIT = 10;

function allowed(email: string, ip: string): boolean {
  const now = Date.now();
  if (now - (byEmail.get(email) ?? 0) < EMAIL_GAP) return false;
  const hits = (byIp.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (hits.length >= IP_LIMIT) return false;
  byEmail.set(email, now);
  byIp.set(ip, [...hits, now]);
  if (byEmail.size > 5000) byEmail.clear();
  if (byIp.size > 5000) byIp.clear();
  return true;
}

/**
 * «Потеряли ссылку?» — присылает ссылки на оплаченные разборы на e-mail из заказа.
 * Ответ всегда одинаковый, чтобы по нему нельзя было узнать, покупал ли человек что-то на сайте.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase().slice(0, 200);
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "?";
  const done = NextResponse.redirect(new URL("/razbor?dostup=1#dostup", SITE.url), 303);
  if (!/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(email) || !allowed(email, ip)) return done;
  try {
    const orders = await paidOrdersByEmail(email);
    if (orders.length) await mailAccess(email, orders.slice(0, 20));
  } catch (e) {
    console.error("razbor dostup:", e);
  }
  return done;
}
