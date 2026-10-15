import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isOrderId, orderState, orderStateLimiter, PAY_COOKIE } from "@/lib/razborOrder";
import { clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const byIp = orderStateLimiter();
const NO_STORE = { "Cache-Control": "no-store" };

/** Статус заказа для опроса со страницы «Спасибо»: { status, short? }. */
export async function GET(req: Request) {
  if (!byIp.take(clientIp(req))) {
    return NextResponse.json({ status: "unknown", error: "Слишком много запросов, попробуй через минуту" }, { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } });
  }
  const order = new URL(req.url).searchParams.get("o") ?? "";
  if (!isOrderId(order)) return NextResponse.json({ status: "unknown" }, { headers: NO_STORE });
  const cookiePayment = (await cookies()).get(PAY_COOKIE)?.value;
  try {
    const { status, short } = await orderState(order, cookiePayment);
    return NextResponse.json({ status, short }, { headers: NO_STORE });
  } catch (e) {
    console.error("razbor status:", order, e);
    return NextResponse.json({ status: "unknown" }, { status: 500, headers: NO_STORE });
  }
}
