import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { readToken, tokenParam } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";
import { bookletStyle } from "@/lib/razborBookletData";
import { fetchBookletPdf, pdfFileName, pdfResponse, pdfWaitResponse } from "@/lib/razborPdf";

export const dynamic = "force-dynamic";

/** Готовый PDF буклета по длинной ссылке: доступ — как у /razbor/r/<токен>/buklet, PDF собирает сервис на VPS. */
export async function GET(req: NextRequest, ctx: RouteContext<"/razbor/r/[token]/buklet/pdf">) {
  const token = tokenParam((await ctx.params).token);
  const input = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ? readToken(token) : null;
  if (!input) notFound();
  const order = input.order ? await getOrder(input.order) : null;
  if (order && (order.status === "refunded" || order.status === "canceled")) notFound();
  const style = bookletStyle(req.nextUrl.searchParams.get("style") ?? undefined);
  const buklet = `/razbor/r/${token}/buklet`;
  const pdf = await fetchBookletPdf(buklet, style, 100_000);
  const date = `${String(input.d).padStart(2, "0")}.${String(input.m).padStart(2, "0")}.${input.y}`;
  return pdf ? pdfResponse(pdf, pdfFileName(input.name, date)) : pdfWaitResponse(`${buklet}?style=${style}`, `${buklet}/pdf?style=${style}`);
}
