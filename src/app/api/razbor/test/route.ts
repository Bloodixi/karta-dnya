import { NextResponse } from "next/server";
import { SITE } from "@/lib/site";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { TEST_COOKIE, TEST_MAX_AGE, testCookieValue, testKeyOk } from "@/lib/razborTest";

const byIp = rateLimit(10, 60_000);

/** Включает (?k=<ключ>) или выключает (?off=1) тестовые покупки в этом браузере. Неверный ключ — 404. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const res = NextResponse.redirect(new URL("/razbor", SITE.url), 303);
  res.headers.set("Cache-Control", "no-store");
  if (q.get("off") === "1") {
    res.cookies.delete(TEST_COOKIE);
    return res;
  }
  if (!byIp.take(clientIp(req)) || !testKeyOk(q.get("k"))) return new NextResponse("Not found", { status: 404 });
  res.cookies.set(TEST_COOKIE, testCookieValue()!, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: TEST_MAX_AGE });
  return res;
}
