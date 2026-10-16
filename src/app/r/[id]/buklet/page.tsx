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

/** Печатный буклет A5 по короткой ссылке /r/<номер заказа>/buklet: только оплаченный заказ, как у /r/<номер>. */
export default async function RazborShortBookletPage({ params, searchParams }: PageProps<"/r/[id]/buklet">) {
  const { id } = await params;
  const order = await getOrder(id.slice(0, 64));
  const input = order?.status === "paid" ? readToken(order.token) : null;
  if (!order || !input) notFound();
  const data = await bookletData(input, `${SITE.url}/r/${order.id}`);
  const style = bookletStyle((await searchParams).style);
  // подарок: на посвящении — подпись и пожелание дарителя (без адресов и дат отправки)
  const g = await giftFor(order);
  return <RazborBooklet {...data} initialStyle={style} backHref={`/r/${order.id}`} gift={g ? { from: g.from, ...(g.wish ? { wish: g.wish } : {}) } : null} />;
}
