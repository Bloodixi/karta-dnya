import { NextResponse } from "next/server";
import { escapeHtml as h, notifyPayment } from "@/lib/notify";
import { isOrderId } from "@/lib/razborOrder";
import { PRODUCTS, productOf } from "@/lib/razborProducts";
import { reviewSig, reviewSigOk } from "@/lib/razborReview";
import { getOrder, patchOrder } from "@/lib/razborStore";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { SITE } from "@/lib/site";

const byIp = rateLimit(10, 3600_000);

/** Одна строка без управляющих символов. */
const clean = (v: FormDataEntryValue | null, max: number, multiline = false) =>
  String(v ?? "")
    .replace(multiline ? /[\u0000-\u0009\u000b-\u001f\u007f]+/g : /[\u0000-\u001f\u007f]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);

/** Отзыв по подписанной ссылке: сохраняется в заказ (повторная отправка — обновление), владельцу — текст в Telegram. */
export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("o") ?? "");
  const sig = String(form.get("s") ?? "");
  if (!isOrderId(id) || !reviewSigOk(id, sig)) return new NextResponse("Not found", { status: 404 });
  const back = (q: string) => NextResponse.redirect(new URL(`/razbor/otzyv?o=${id}&s=${reviewSig(id)}${q}`, SITE.url), 303);
  if (!byIp.take(clientIp(req))) return new NextResponse("Too many requests", { status: 429, headers: { "Retry-After": "3600" } });
  const order = await getOrder(id);
  if (!order || order.status !== "paid") return new NextResponse("Not found", { status: 404 });
  const stars = Number(form.get("stars"));
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return back("&err=stars");
  const review = { stars, text: clean(form.get("text"), 1000, true), name: clean(form.get("name"), 40), publish: form.get("publish") === "1", at: new Date().toISOString() };
  const again = Boolean(order.review);
  await patchOrder(id, { review });
  await notifyPayment(
    [
      `<b>${"★".repeat(stars)}${"☆".repeat(5 - stars)} ${again ? "Отзыв обновлён" : "Новый отзыв"}</b> · ${h(PRODUCTS[productOf(order.product)].short)}`,
      review.text ? h(review.text) : "<i>без текста</i>",
      `${review.name ? `Подпись: ${h(review.name)} · ` : ""}${review.publish ? "можно публиковать" : "<b>не публиковать</b>"}`,
      `<i>Заказ ${h(id)}</i>`,
    ].join("\n"),
    true,
  ).catch(() => {});
  return back("&ok=1");
}
