import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cleanName, parseDate, type BirthDate } from "@/lib/numerology";
import { ageAt, nowMsk, RAZBOR_VERSION } from "@/lib/razbor";
import { CHILD_MAX_AGE, CHILD_VERSION, childReady } from "@/lib/razborChild";
import { COMPAT_VERSION, compatReady } from "@/lib/razborCompat";
import { PAY_COOKIE, rememberOrder } from "@/lib/razborOrder";
import { cleanEmail, giftMetadata, giftYm, parseGift } from "@/lib/razborGift";
import { PRODUCTS, type Product } from "@/lib/razborProducts";
import { patchOrder, saveOrder, type Gift, type Order } from "@/lib/razborStore";
import { makeChildToken, makeCompatToken, makeToken } from "@/lib/razborToken";
import { createPayment, yookassaReady } from "@/lib/yookassa";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";
import { TEST_COOKIE, testCookieOk } from "@/lib/razborTest";

/** Не больше 5 заказов за 10 минут с одного IP: каждый заказ — платёж в ЮKassa и файл на томе. */
const byIp = rateLimit(5, 10 * 60_000);

function tooMany(back: string): Response {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Слишком много попыток</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.5">
<h1 style="font-size:24px">Слишком много попыток оплаты</h1>
<p>С этого адреса за последние минуты создано уже несколько заказов. Подожди минут десять и попробуй ещё раз.</p>
<p><a href="${back}#oplata">Вернуться к странице заказа</a></p>
</body></html>`;
  return new Response(html, { status: 429, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "600", "Cache-Control": "no-store" } });
}

/** Что заказывают: обычный разбор (по умолчанию, в том числе пакет с совместимостью), совместимость или детский разбор. */
type Kind = "razbor" | "compat" | "child";
const kindOf = (v: FormDataEntryValue | null): Kind => (v === "compat" || v === "child" ? v : "razbor");

/** Данные заказа после проверки формы — или адрес возврата на форму с кодом ошибки. */
type Parsed = {
  product: Product;
  a: BirthDate;
  name: string;
  b?: BirthDate;
  name2?: string;
  gift?: Gift;
  email: string;
};

const enc = encodeURIComponent;

/** Проверка полей формы на сервере: даты, имена (cleanName — только буквы, пробел и дефис, до 60), e-mail, подарок. */
function parse(form: FormData): { ok: Parsed } | { back: string } {
  const kind = kindOf(form.get("product"));
  const a = parseDate(String(form.get("date") ?? ""));
  const name = cleanName(String(form.get("name") ?? ""));
  const email = cleanEmail(form.get("email"));
  const b = parseDate(String(form.get("date2") ?? ""));
  const name2 = cleanName(String(form.get("name2") ?? ""));

  if (kind === "compat") {
    const base = PRODUCTS.compat.path;
    const again = `a=${a?.iso ?? ""}&b=${b?.iso ?? ""}${name ? `&na=${enc(name)}` : ""}${name2 ? `&nb=${enc(name2)}` : ""}`;
    if (!a || !b) return { back: `${base}?${again}&err=date` };
    if (!name || !name2) return { back: `${base}?${again}&err=name` };
    if (!email) return { back: `${base}?${again}&err=email` };
    if (!compatReady()) return { back: `${base}?${again}&err=soon` };
    return { ok: { product: "compat", a, name, b, name2, email } };
  }

  if (kind === "child") {
    const base = PRODUCTS.child.path;
    if (!a) return { back: `${base}?err=date` };
    const again = `d=${a.iso}${name ? `&n=${enc(name)}` : ""}`;
    const age = ageAt({ d: a.d, m: a.m, y: a.y, ...nowMsk() });
    if (age < 0 || age > CHILD_MAX_AGE) return { back: `${base}?${again}&err=age` };
    if (!email) return { back: `${base}?${again}&err=email` };
    if (!childReady()) return { back: `${base}?${again}&err=soon` };
    return { ok: { product: "child", a, name, email } };
  }

  const isGift = form.get("for") === "gift";
  const pack = !isGift && form.get("pack") === "1";
  if (!a) return { back: "/razbor?err=date" };
  const again = `d=${a.iso}${name ? `&n=${enc(name)}` : ""}${isGift ? "&g=1" : ""}${pack ? `&p=1${b ? `&d2=${b.iso}` : ""}${name2 ? `&n2=${enc(name2)}` : ""}` : ""}`;
  let gift: Gift | undefined;
  if (isGift) {
    const g = parseGift(form, name);
    if ("error" in g) return { back: `/razbor?${again}&err=${g.error}` };
    gift = g.gift;
  }
  if (pack) {
    if (!b) return { back: `/razbor?${again}&err=date2` };
    if (!name2) return { back: `/razbor?${again}&err=name2` };
    if (!compatReady()) return { back: `/razbor?${again}&err=soon` };
  }
  if (!email) return { back: `/razbor?${again}&err=email` };
  return { ok: { product: pack ? "pack" : "razbor", a, name, ...(pack ? { b: b!, name2 } : {}), gift, email } };
}

/** Формы оплаты разбора, совместимости и детского разбора: создаёт платёж ЮKassa и отправляет на страницу оплаты. */
export async function POST(req: Request) {
  const form = await req.formData();
  const r = parse(form);
  const redirect = (path: string) => NextResponse.redirect(new URL(`${path}#oplata`, SITE.url), 303);
  if ("back" in r) return redirect(r.back);
  const { product, a, name, b, name2, gift, email } = r.ok;
  const info = PRODUCTS[product];
  const retry =
    product === "compat"
      ? `${info.path}?a=${a.iso}&b=${b!.iso}&na=${enc(name)}&nb=${enc(name2 ?? "")}`
      : `${info.path}?d=${a.iso}${name ? `&n=${enc(name)}` : ""}${gift ? "&g=1" : ""}${product === "pack" ? `&p=1&d2=${b!.iso}&n2=${enc(name2 ?? "")}` : ""}`;
  // тестовая покупка владельца (cookie из /api/razbor/test) — платёж в тестовом магазине
  const test = testCookieOk((await cookies()).get(TEST_COOKIE)?.value);
  if (!yookassaReady(test ? "test" : "live")) return redirect(`${retry}&err=pay`);
  // считаем только попытки, которые дошли бы до ЮKassa: опечатка в форме лимит не тратит
  if (!byIp.take(clientIp(req))) return tooMany(info.path);

  const order = randomBytes(9).toString("base64url");
  // отложенный подарок: прогноз — с месяца, когда получатель откроет письмо (его же yr/mo — в токене и metadata)
  const { yr, mo } = giftYm(gift, nowMsk());
  const A = { d: a.d, m: a.m, y: a.y, name: name || undefined };
  const pair = b ? makeCompatToken({ a: A, b: { d: b.d, m: b.m, y: b.y, name: name2 || undefined }, yr, mo, v: COMPAT_VERSION }, order) : "";
  const v = product === "compat" ? COMPAT_VERSION : product === "child" ? CHILD_VERSION : RAZBOR_VERSION;
  const token = product === "compat" ? pair : product === "child" ? makeChildToken({ ...A, yr, mo, v }, order) : makeToken({ ...A, yr, mo, v }, order);
  const draft: Order = {
    id: order, token, date: a.iso, name, email,
    amount: info.price, status: "pending", payment_id: "", created_at: new Date().toISOString(), paid_at: "", yr, mo,
    ...(gift ? { gift } : {}),
    ...(product !== "razbor" ? { product } : {}),
    ...(b ? { date2: b.iso, name2: name2 ?? "" } : {}),
    ...(product === "pack" ? { token2: pair } : {}),
    ...(test ? { test: true } : {}),
  };
  const dates = b ? `${a.iso} и ${b.iso}` : a.iso;
  try {
    // Без файла заказа оплата всё равно пройдёт: данные дублируются в metadata платежа.
    await saveOrder(draft).catch((e) => console.error("razbor checkout: заказ не записан", order, e));
    const p = await createPayment({
      idempotenceKey: `razbor-${order}`,
      amount: info.price,
      description: `${test ? "[ТЕСТ] " : ""}${info.title}${gift ? " в подарок" : ""}, ${dates}`,
      returnUrl: `${SITE.url}/razbor/spasibo?o=${order}`,
      metadata: {
        order, date: a.iso, name, yr: String(yr), mo: String(mo), v: String(v), email, ...giftMetadata(gift),
        // обычный разбор — без новых полей, как до фазы 3
        ...(product !== "razbor" ? { p: product } : {}),
        ...(b ? { date2: b.iso, name2: name2 ?? "" } : {}),
        ...(product === "pack" ? { v2: String(COMPAT_VERSION) } : {}),
      },
      email,
      method: form.get("method") === "sbp" ? "sbp" : undefined,
      shop: test ? "test" : "live",
    });
    const url = p.confirmation?.confirmation_url;
    if (!url) throw new Error("нет confirmation_url");
    rememberOrder(order, p.id);
    // по очереди с вебхуком; файла нет (первая запись не удалась) — пишем черновик целиком
    await patchOrder(order, { payment_id: p.id }).then(async (o) => { if (!o) await saveOrder({ ...draft, payment_id: p.id }); }).catch((e) => console.error("razbor checkout: payment_id не записан", order, e));
    const res = NextResponse.redirect(url, 303);
    res.cookies.set(PAY_COOKIE, p.id, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 3 * 86400 });
    return res;
  } catch (e) {
    console.error("razbor checkout:", product, e);
    return redirect(`${retry}&err=pay`);
  }
}
