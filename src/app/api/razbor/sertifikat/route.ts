import { NextResponse } from "next/server";
import { cleanName, parseDate } from "@/lib/numerology";
import { redeemCert } from "@/lib/razborCert";
import { readCertCode } from "@/lib/razborGift";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";
import { todayMskIso } from "@/lib/giftSeason";

/** Не больше 20 попыток активации за 10 минут с одного IP. */
const byIp = rateLimit(20, 10 * 60_000);

/** Активация сертификата: проверка подписи кода, даты и имени → документ разбора по короткой ссылке /r/<номер>. */
export async function POST(req: Request) {
  const form = await req.formData();
  const code = String(form.get("c") ?? "").slice(0, 120);
  const id = readCertCode(code);
  const back = (q: string) => NextResponse.redirect(new URL(`/razbor/sertifikat?c=${encodeURIComponent(code)}${q}`, SITE.url), 303);
  if (!id) return NextResponse.redirect(new URL("/razbor/sertifikat", SITE.url), 303);
  if (!byIp.take(clientIp(req))) return back("&err=many");
  const date = parseDate(String(form.get("date") ?? ""));
  const name = cleanName(String(form.get("name") ?? ""));
  if (!date || date.iso > todayMskIso()) return back(`&err=date${name ? `&n=${encodeURIComponent(name)}` : ""}`);
  const r = await redeemCert(id, date, name, form.get("email"));
  if (r.state === "ok" || r.state === "redeemed") return NextResponse.redirect(new URL(r.state === "ok" ? `/r/${id}` : `/razbor/sertifikat?c=${encodeURIComponent(code)}`, SITE.url), 303);
  return back("");
}
