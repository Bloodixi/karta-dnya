import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RazborResult, { PackLink } from "@/components/RazborResult";
import { giftFor } from "@/lib/razborGift";
import { buildDoc, DOC_PAGE, productOf } from "@/lib/razborProducts";
import { readDocToken, tokenParam } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";

export const dynamic = "force-dynamic";

const ROBOTS = { index: false, follow: false };

export async function generateMetadata({ params }: PageProps<"/razbor/r/[token]">): Promise<Metadata> {
  const t = readDocToken(tokenParam((await params).token));
  const page = DOC_PAGE[t?.p ?? "razbor"];
  return { title: page.title, description: page.description, robots: ROBOTS };
}

export default async function RazborResultPage({ params }: PageProps<"/razbor/r/[token]">) {
  const { token } = await params;
  const t = readDocToken(tokenParam(token));
  if (!t) notFound();
  // в новых ссылках есть номер заказа: после возврата или отмены ссылка закрыта (старые ссылки номера не содержат)
  const order = t.order ? await getOrder(t.order) : null;
  if (order && (order.status === "refunded" || order.status === "canceled")) notFound();
  const doc = buildDoc(t);
  // подарок — у разбора, совместимости, детского разбора и сертификата (в пакете подарка нет)
  const gift = order && productOf(order.product) !== "pack" ? await giftFor(order) : null;
  // пакет: со страницы разбора — на совместимость, со страницы совместимости — на разбор
  const pack = order && productOf(order.product) === "pack" && order.token2 ? order : null;
  const extra = pack ? (t.p === "razbor" ? <PackLink href={`/razbor/r/${pack.token2}`} label="совместимость пары" /> : <PackLink href={`/razbor/r/${pack.token}`} label="разбор по дате рождения" />) : null;

  return (
    <RazborResult
      kind={t.p}
      doc={doc}
      gift={gift}
      bookletHref={t.p === "razbor" ? `/razbor/r/${token}/buklet` : undefined}
      extra={extra}
      note={
        <p className="no-print text-sm text-muted mt-3">
          {gift ? `Ссылка постоянная — сохрани письмо с ней или добавь эту страницу в закладки: ${t.p === "compat" ? "совместимость откроется" : "разбор откроется"} в любой момент и на любом устройстве.` : `Ссылка постоянная — добавь в закладки. По ней ${t.p === "compat" ? "совместимость" : "разбор"} откроется в любой момент и на любом устройстве.`}
        </p>
      }
    />
  );
}
