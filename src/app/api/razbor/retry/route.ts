import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cronAuth";
import { retryStuck } from "@/lib/razborOrder";

export const dynamic = "force-dynamic";

let running: ReturnType<typeof retryStuck> | null = null;

/**
 * Вызов с сервера раз в 15 минут (таймер karta-razbor-retry): доделывает чек и письмо у оплаченных заказов,
 * где они не получились сразу. В ответе только счётчики.
 */
export async function POST(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ ok: false }, { status: 403 });
  try {
    running ??= retryStuck().finally(() => {
      running = null;
    });
    return NextResponse.json({ ok: true, ...(await running) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("razbor retry:", (e as Error).message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
