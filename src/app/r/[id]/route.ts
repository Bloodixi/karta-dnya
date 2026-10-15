import { NextResponse } from "next/server";
import { getOrder } from "@/lib/razborStore";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Короткая ссылка на оплаченный разбор: /r/<номер заказа> → /razbor/r/<подписанный токен>. Номер заказа случайный, его знает только покупатель. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await getOrder(id.slice(0, 64));
  const to = o?.status === "paid" ? `/razbor/r/${o.token}` : "/razbor";
  return NextResponse.redirect(new URL(to, SITE.url), 307);
}
