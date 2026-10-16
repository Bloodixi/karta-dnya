import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RazborBooklet from "@/components/RazborBooklet";
import { readToken } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";
import { giftFor } from "@/lib/razborGift";
import { bookletData, bookletStyle } from "@/lib/razborBookletData";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Буклет разбора для печати",
  description: "Личный нумерологический разбор в виде буклета A5 для печати или сохранения в PDF. Страница доступна только по ссылке.",
  robots: { index: false, follow: false },
};

/** Печатный буклет A5 по длинной ссылке на разбор: доступ проверяется так же, как у /razbor/r/<токен>. */
export default async function RazborBookletPage({ params, searchParams }: PageProps<"/razbor/r/[token]/buklet">) {
  const { token } = await params;
  const input = readToken(decodeURIComponent(token));
  if (!input) notFound();
  // после возврата или отмены ссылка закрыта (старые ссылки номера заказа не содержат)
  const order = input.order ? await getOrder(input.order) : null;
  if (order && (order.status === "refunded" || order.status === "canceled")) notFound();
  // QR на обложке — короткая ссылка, если заказ оплачен; иначе эта же длинная
  const online = order?.status === "paid" ? `${SITE.url}/r/${order.id}` : `${SITE.url}/razbor/r/${token}`;
  const data = await bookletData(input, online);
  const sp = await searchParams;
  const style = bookletStyle(sp.style);
  // подарок: на посвящении — подпись и пожелание дарителя (без адресов и дат отправки)
  const g = order ? await giftFor(order) : null;
  return <RazborBooklet {...data} initialStyle={style} print={sp.print === "1"} pdfHref={`/razbor/r/${token}/buklet/pdf`} backHref={`/razbor/r/${token}`} gift={g ? { from: g.from, ...(g.wish ? { wish: g.wish } : {}) } : null} />;
}
