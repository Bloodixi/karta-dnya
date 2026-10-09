import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanName, parseDate } from "@/lib/numerology";
import { nowMsk, RAZBOR } from "@/lib/razbor";
import { PAY_COOKIE, rememberOrder } from "@/lib/razborOrder";
import { createPayment, yookassaReady } from "@/lib/yookassa";
import { SITE } from "@/lib/site";

/** Форма «Получить полный разбор»: создаёт платёж ЮKassa и отправляет на страницу оплаты. */
export async function POST(req: Request) {
  const form = await req.formData();
  const birth = parseDate(String(form.get("date") ?? ""));
  const name = cleanName(String(form.get("name") ?? ""));
  const emailRaw = String(form.get("email") ?? "").trim();
  const email = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(emailRaw) ? emailRaw : "";
  const back = (q: string) => NextResponse.redirect(new URL(`/razbor?${q}#oplata`, SITE.url), 303);
  if (!birth) return back("err=date");
  if (!yookassaReady()) return back(`d=${birth.iso}&err=pay`);

  const order = randomBytes(9).toString("base64url");
  const { yr, mo } = nowMsk();
  try {
    const p = await createPayment({
      amount: RAZBOR.price,
      description: `${RAZBOR.title}, ${birth.iso}`,
      returnUrl: `${SITE.url}/razbor/spasibo?o=${order}`,
      metadata: { order, date: birth.iso, name, yr: String(yr), mo: String(mo), email },
      email,
    });
    const url = p.confirmation?.confirmation_url;
    if (!url) throw new Error("нет confirmation_url");
    rememberOrder(order, p.id);
    const res = NextResponse.redirect(url, 303);
    res.cookies.set(PAY_COOKIE, p.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/razbor", maxAge: 3 * 86400 });
    return res;
  } catch (e) {
    console.error("razbor checkout:", e);
    return back(`d=${birth.iso}&err=pay`);
  }
}
