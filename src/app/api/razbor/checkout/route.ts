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
import { BodyTooLarge, readForm, tooLarge } from "@/lib/bodyLimit";
import { clientIp, sharedRateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";
import { TEST_COOKIE, testCookieOk } from "@/lib/razborTest";

/** Не больше 5 заказов за 10 минут с одного IP: каждый заказ — платёж в ЮKassa и файл на томе. */
const byIp = sharedRateLimit("checkout-ip", 5, 10 * 60_000);

function tooMany(back: string): Response {
  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Слишком много попыток</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:48px auto;padding:0 16px;line-height:1.5">
<h1 style="font-size:24px">Слишком много попыток оплаты</h1>
<p>С этого адреса за последние минуты создано уже несколько заказов. Подожди минут десять и попробуй ещё раз.</p>
<p><a href="${back}#oplata">Вернуться к странице заказа</a></p>
</body></html>`;
  return new Response(html, { status: 429, headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "600", "Cache-Control": "no-store" } });
}

/** Что заказывают: обычный разбор (по умолчанию, в том числе пакет с совместимостью), совместимость, детский разбор или сертификат. */
type Kind = "razbor" | "compat" | "child" | "cert";
const kindOf = (v: FormDataEntryValue | null): Kind => (v === "compat" || v === "child" || v === "cert" ? v : "razbor");

/** Данные заказа после проверки формы — или адрес возврата на форму с кодом ошибки. */
type Parsed = {
  product: Product;
  /** Дата документа; у сертификата её нет — получатель введёт сам. */
  a?: BirthDate;
  name: string;
  b?: BirthDate;
  name2?: string;
  gift?: Gift;
  email: string;
  /** Галочка «Присылать раз в год напоминание о новом прогнозе». */
  yearly: boolean;
  /** Куда вернуть покупателя, если платёж не создался: страница формы с заполненными полями. */
  retry: string;
};

const enc = encodeURIComponent;

/** Подарок из формы, если выбран режим «В подарок»: `name` — имя для проверки (null — продукт проверяет сам). */
function giftOf(form: FormData, name: string | null): { gift?: Gift } | { error: string } {
  if (form.get("for") !== "gift") return {};
  const g = parseGift(form, name);
  return "error" in g ? { error: g.error } : { gift: g.gift };
}

/**
 * Проверка полей формы на сервере: даты, имена (cleanName — только буквы, пробел и дефис, до 60), e-mail, подарок.
 * Пакет «разбор + совместимость» (pack=1) приходит из двух форм: разбора (вторая дата — date2) и совместимости
 * (product=compat, первая дата — личный разбор). Заказ в обоих случаях одинаковый, отличается только страница возврата.
 * Подарок (for=gift) — у всех продуктов, кроме пакета; у разбора дата получателя — отдельное поле gift_date.
 */
function parse(form: FormData): { ok: Parsed } | { back: string } {
  const kind = kindOf(form.get("product"));
  const own = parseDate(String(form.get("date") ?? ""));
  const name = cleanName(String(form.get("name") ?? ""));
  const email = cleanEmail(form.get("email"));
  const b = parseDate(String(form.get("date2") ?? ""));
  const name2 = cleanName(String(form.get("name2") ?? ""));
  const isGift = form.get("for") === "gift";
  // напоминание через год — только себе: в подарке дата чужая
  const yearly = !isGift && kind !== "cert" && form.get("consent_yearly") === "1";

  if (kind === "cert") {
    // сертификат всегда подарок: получатель сам введёт дату и имя по ссылке из письма
    const base = "/razbor?c=1";
    const g = parseGift(form, null);
    if ("error" in g) return { back: `${base}&err=${g.error}` };
    if (!email) return { back: `${base}&err=email` };
    return { ok: { product: "cert", name: "", gift: g.gift, email, yearly: false, retry: `${base}` } };
  }

  if (kind === "compat") {
    const a = own;
    const base = PRODUCTS.compat.path;
    const pack = !isGift && form.get("pack") === "1";
    const again = `a=${a?.iso ?? ""}&b=${b?.iso ?? ""}${name ? `&na=${enc(name)}` : ""}${name2 ? `&nb=${enc(name2)}` : ""}${pack ? "&p=1" : ""}${isGift ? "&g=1" : ""}`;
    if (!a || !b) return { back: `${base}?${again}&err=date` };
    if (!name || !name2) return { back: `${base}?${again}&err=name` };
    const g = giftOf(form, null);
    if ("error" in g) return { back: `${base}?${again}&err=${g.error}` };
    if (!email) return { back: `${base}?${again}&err=email` };
    if (!compatReady()) return { back: `${base}?${again}&err=soon` };
    return { ok: { product: pack ? "pack" : "compat", a, name, b, name2, gift: g.gift, email, yearly, retry: `${base}?${again}` } };
  }

  if (kind === "child") {
    const a = own;
    const base = PRODUCTS.child.path;
    if (!a) return { back: `${base}?err=date` };
    const again = `d=${a.iso}${name ? `&n=${enc(name)}` : ""}${isGift ? "&g=1" : ""}`;
    const age = ageAt({ d: a.d, m: a.m, y: a.y, ...nowMsk() });
    if (age < 0 || age > CHILD_MAX_AGE) return { back: `${base}?${again}&err=age` };
    const g = giftOf(form, null);
    if ("error" in g) return { back: `${base}?${again}&err=${g.error}` };
    if (!email) return { back: `${base}?${again}&err=email` };
    if (!childReady()) return { back: `${base}?${again}&err=soon` };
    return { ok: { product: "child", a, name, gift: g.gift, email, yearly, retry: `${base}?${again}` } };
  }

  // разбор: в подарок — дата получателя из своего поля (gift_date); в старой форме без этого поля — дата страницы
  const a = isGift && form.has("gift_date") ? parseDate(String(form.get("gift_date") ?? "")) : own;
  const pack = !isGift && form.get("pack") === "1";
  const keep = own ?? (isGift ? null : a);
  const ny = form.get("ny") === "1" ? "&ny=1" : "";
  const again = `${keep ? `d=${keep.iso}` : ""}${!isGift && name ? `&n=${enc(name)}` : ""}${isGift ? `&g=1${ny}` : ""}${pack ? `&p=1${b ? `&d2=${b.iso}` : ""}${name2 ? `&n2=${enc(name2)}` : ""}` : ""}`.replace(/^&/, "");
  if (!a) return { back: `/razbor?${again}&err=${isGift ? "gift_bdate" : "date"}` };
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
  return { ok: { product: pack ? "pack" : "razbor", a, name, ...(pack ? { b: b!, name2 } : {}), gift, email, yearly, retry: `/razbor?${again}` } };
}

/** Формы оплаты разбора, совместимости, детского разбора и сертификата: создаёт платёж ЮKassa и отправляет на страницу оплаты. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await readForm(req);
  } catch (e) {
    if (e instanceof BodyTooLarge) return tooLarge();
    return new Response("Bad request", { status: 400 });
  }
  const r = parse(form);
  // сертификат оформляется в своём блоке на /razbor — туда и возвращаем
  const redirect = (path: string) => NextResponse.redirect(new URL(`${path}${path.startsWith("/razbor?c=1") ? "#sertifikat" : "#oplata"}`, SITE.url), 303);
  if ("back" in r) return redirect(r.back);
  const { product, a, name, b, name2, gift, email, yearly, retry } = r.ok;
  const info = PRODUCTS[product];
  // тестовая покупка владельца (cookie из /api/razbor/test) — платёж в тестовом магазине
  const test = testCookieOk((await cookies()).get(TEST_COOKIE)?.value);
  if (!yookassaReady(test ? "test" : "live")) return redirect(`${retry}&err=pay`);
  // считаем только попытки, которые дошли бы до ЮKassa: опечатка в форме лимит не тратит
  if (!byIp.take(clientIp(req))) return tooMany(retry.split("?")[0]);

  const order = randomBytes(9).toString("base64url");
  // отложенный подарок: прогноз — с месяца, когда получатель откроет письмо (его же yr/mo — в токене и metadata)
  const { yr, mo } = giftYm(gift, nowMsk());
  const A = a ? { d: a.d, m: a.m, y: a.y, name: name || undefined } : null;
  const pair = A && b ? makeCompatToken({ a: A, b: { d: b.d, m: b.m, y: b.y, name: name2 || undefined }, yr, mo, v: COMPAT_VERSION }, order) : "";
  const v = product === "compat" ? COMPAT_VERSION : product === "child" ? CHILD_VERSION : RAZBOR_VERSION;
  // сертификат — без документа: дата, имя и ссылка появятся, когда получатель его активирует (/razbor/sertifikat)
  const token = !A ? "" : product === "compat" ? pair : product === "child" ? makeChildToken({ ...A, yr, mo, v }, order) : makeToken({ ...A, yr, mo, v }, order);
  const draft: Order = {
    id: order, token, date: a?.iso ?? "", name, email,
    amount: info.price, status: "pending", payment_id: "", created_at: new Date().toISOString(), paid_at: "", yr, mo,
    ...(gift ? { gift } : {}),
    ...(product !== "razbor" ? { product } : {}),
    ...(b ? { date2: b.iso, name2: name2 ?? "" } : {}),
    ...(product === "pack" ? { token2: pair } : {}),
    ...(test ? { test: true } : {}),
    ...(yearly ? { consent_yearly: true } : {}),
  };
  const dates = !a ? "дата — у получателя" : b ? `${a.iso} и ${b.iso}` : a.iso;
  try {
    // Без файла заказа оплата всё равно пройдёт: данные дублируются в metadata платежа.
    await saveOrder(draft).catch((e) => console.error("razbor checkout: заказ не записан", order, e));
    const p = await createPayment({
      idempotenceKey: `razbor-${order}`,
      amount: info.price,
      description: `${test ? "[ТЕСТ] " : ""}${info.title}${gift && product !== "cert" ? " в подарок" : ""}, ${dates}`,
      returnUrl: `${SITE.url}/razbor/spasibo?o=${order}`,
      metadata: {
        order, date: a?.iso ?? "", name, yr: String(yr), mo: String(mo), v: String(v), email, ...giftMetadata(gift),
        ...(yearly ? { yearly: "1" } : {}),
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
