import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RazborResult, { PackLink } from "@/components/RazborResult";
import { giftFor } from "@/lib/razborGift";
import { buildDoc, DOC_PAGE, productOf } from "@/lib/razborProducts";
import { readDocToken } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";

export const dynamic = "force-dynamic";

const ROBOTS = { index: false, follow: false };

/** Документ заказа по короткой ссылке: основной токен заказа (разбор, совместимость или детский разбор). */
async function load(id: string) {
  const order = await getOrder(id.slice(0, 64));
  const t = order?.status === "paid" ? readDocToken(order.token) : null;
  return order && t ? { order, t } : null;
}

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const r = await load((await params).id);
  const page = DOC_PAGE[r?.t.p ?? "razbor"];
  return { title: page.title, description: page.description, robots: ROBOTS };
}

/** Короткая ссылка на оплаченный документ: /r/<номер заказа>. Номер случайный (72 бита), его знает только покупатель. */
export default async function RazborShortPage({ params }: PageProps<"/r/[id]">) {
  const { id } = await params;
  const r = await load(id);
  if (!r) notFound();
  const { order, t } = r;
  const doc = buildDoc(t);
  const gift = t.p === "razbor" ? await giftFor(order) : null;
  const pack = productOf(order.product) === "pack" && order.token2;

  return (
    <RazborResult
      kind={t.p}
      doc={doc}
      gift={gift}
      bookletHref={t.p === "razbor" ? `/r/${id}/buklet` : undefined}
      extra={pack ? <PackLink href={`/r/${id}/para`} label="совместимость пары" /> : null}
      note={
        gift ? (
          <p className="no-print text-sm text-muted mt-3">Ссылка постоянная — сохрани письмо с ней или добавь эту страницу в закладки: разбор откроется в любой момент и на любом устройстве.</p>
        ) : (
          <p className="no-print text-sm text-muted mt-3">Ссылка постоянная — добавь в закладки. Она же пришла тебе на почту; если она потеряется — <Link href="/razbor#dostup" className="underline">пришлём ещё раз</Link>.</p>
        )
      }
    />
  );
}
