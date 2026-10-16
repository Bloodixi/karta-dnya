import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanName, parseDate } from "@/lib/numerology";
import { nowMsk, RAZBOR, RAZBOR_VERSION } from "@/lib/razbor";
import { PAY_COOKIE, rememberOrder } from "@/lib/razborOrder";
import { cleanEmail, giftMetadata, giftYm, parseGift } from "@/lib/razborGift";
import { saveOrder, type Gift, type Order } from "@/lib/razborStore";
import { makeToken } from "@/lib/razborToken";
import { createPayment, yookassaReady } from "@/lib/yookassa";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";

/** Не больше 5 заказов за 10 минут с одного IP: каждый заказ — платёж в ЮKassa и файл на томе. */
const byIp = rateLimit(5, 10 * 60_000);

function tooMany(): Response {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Слишком много попыток</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.5">
<h1 style="font-size:24px">Слишком много попыток оплаты</h1>
<p>С этого адреса за последние минуты создано уже несколько заказов. Подожди минут десять и попробуй ещё раз.</p>
<p><a href="/razbor#oplata">Вернуться к разбору</a></p>
</body></html>`;
  return new Response(html, { status: 429, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "600", "Cache-Control": "no-store" } });
}

/** Форма «Получить полный разбор»: создаёт платёж ЮKassa и отправляет на страницу оплаты. */
export async function POST(req: Request) {
  const form = await req.formData();
  const birth = parseDate(String(form.get("date") ?? ""));
  const name = cleanName(String(form.get("name") ?? ""));
  const email = cleanEmail(form.get("email"));
  const isGift = form.get("for") === "gift";
  const back = (q: string) => NextResponse.redirect(new URL(`/razbor?${q}#oplata`, SITE.url), 303);
  if (!birth) return back("err=date");
  const again = `d=${birth.iso}${name ? `&n=${encodeURIComponent(name)}` : ""}${isGift ? "&g=1" : ""}`;
  let gift: Gift | undefined;
  if (isGift) {
    const g = parseGift(form, name);
    if ("error" in g) return back(`${again}&err=${g.error}`);
    gift = g.gift;
  }
  if (!email) return back(`${again}&err=email`);
  if (!yookassaReady()) return back(`${again}&err=pay`);
  // считаем только попытки, которые дошли бы до ЮKassa: опечатка в форме лимит не тратит
  if (!byIp.take(clientIp(req))) return tooMany();

  const order = randomBytes(9).toString("base64url");
  // отложенный подарок: прогноз — с месяца, когда получатель откроет письмо (его же yr/mo — в токене и metadata)
  const { yr, mo } = giftYm(gift, nowMsk());
  const draft: Order = {
    id: order, token: makeToken({ d: birth.d, m: birth.m, y: birth.y, name: name || undefined, yr, mo, v: RAZBOR_VERSION }, order), date: birth.iso, name, email,
    amount: RAZBOR.price, status: "pending", payment_id: "", created_at: new Date().toISOString(), paid_at: "", yr, mo,
    ...(gift ? { gift } : {}),
  };
  try {
    // Без файла заказа оплата всё равно пройдёт: данные дублируются в metadata платежа.
    await saveOrder(draft).catch((e) => console.error("razbor checkout: заказ не записан", order, e));
    const p = await createPayment({
      idempotenceKey: `razbor-${order}`,
      amount: RAZBOR.price,
      description: `${RAZBOR.title}${gift ? " в подарок" : ""}, ${birth.iso}`,
      returnUrl: `${SITE.url}/razbor/spasibo?o=${order}`,
      metadata: { order, date: birth.iso, name, yr: String(yr), mo: String(mo), v: String(RAZBOR_VERSION), email, ...giftMetadata(gift) },
      email,
      method: form.get("method") === "sbp" ? "sbp" : undefined,
    });
    const url = p.confirmation?.confirmation_url;
    if (!url) throw new Error("нет confirmation_url");
    rememberOrder(order, p.id);
    await saveOrder({ ...draft, payment_id: p.id }).catch((e) => console.error("razbor checkout: payment_id не записан", order, e));
    const res = NextResponse.redirect(url, 303);
    res.cookies.set(PAY_COOKIE, p.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 3 * 86400 });
    return res;
  } catch (e) {
    console.error("razbor checkout:", e);
    return back(`${again}&err=pay`);
  }
}
