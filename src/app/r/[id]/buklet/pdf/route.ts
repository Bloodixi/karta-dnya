import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { readToken } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";
import { bookletStyle } from "@/lib/razborBookletData";
import { fetchBookletPdf, pdfFileName, pdfResponse, pdfWaitResponse } from "@/lib/razborPdf";

export const dynamic = "force-dynamic";

/** Готовый PDF буклета по короткой ссылке /r/<номер>/buklet/pdf: только оплаченный заказ, как у /r/<номер>. */
export async function GET(req: NextRequest, ctx: RouteContext<"/r/[id]/buklet/pdf">) {
  const order = await getOrder((await ctx.params).id.slice(0, 64));
  const input = order?.status === "paid" ? readToken(order.token) : null;
  if (!order || !input || !/^[A-Za-z0-9_-]{12}$/.test(order.id)) notFound();
  const style = bookletStyle(req.nextUrl.searchParams.get("style") ?? undefined);
  const buklet = `/r/${order.id}/buklet`;
  const pdf = await fetchBookletPdf(buklet, style, 100_000);
  return pdf ? pdfResponse(pdf, pdfFileName(order.name || input.name, order.date.split("-").reverse().join("."))) : pdfWaitResponse(`${buklet}?style=${style}`, `${buklet}/pdf?style=${style}`);
}
