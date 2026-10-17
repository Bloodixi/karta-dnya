import { NextResponse } from "next/server";
import { unsubOk } from "@/lib/razborGift";
import { getOrder, patchOrder } from "@/lib/razborStore";
import { SITE } from "@/lib/site";

/** Отписка от письма «Прогноз на следующий год» по подписанной ссылке (razborGift.unsubUrl). Повтор безопасен. */
export async function POST(req: Request) {
  const form = await req.formData();
  const id = String(form.get("o") ?? "").slice(0, 64);
  const s = String(form.get("s") ?? "").slice(0, 64);
  if (!unsubOk(id, s)) return NextResponse.redirect(new URL("/razbor", SITE.url), 303);
  const o = await getOrder(id);
  if (o && !o.yearly_off_at) await patchOrder(id, { yearly_off_at: new Date().toISOString(), consent_yearly: false });
  return NextResponse.redirect(new URL(`/razbor/otpiska?o=${id}&s=${encodeURIComponent(s)}&done=1`, SITE.url), 303);
}
