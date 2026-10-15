import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { orderState, PAY_COOKIE } from "@/lib/razborOrder";

export const dynamic = "force-dynamic";

/** Статус заказа для опроса со страницы «Спасибо»: { status, path? }. */
export async function GET(req: Request) {
  const order = (new URL(req.url).searchParams.get("o") ?? "").slice(0, 64);
  const cookiePayment = (await cookies()).get(PAY_COOKIE)?.value;
  try {
    return NextResponse.json(await orderState(order, cookiePayment), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("razbor status:", order, e);
    return NextResponse.json({ status: "unknown" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
