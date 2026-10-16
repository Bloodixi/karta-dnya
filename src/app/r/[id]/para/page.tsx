import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RazborResult, { PackLink } from "@/components/RazborResult";
import { buildDoc, DOC_PAGE, productOf } from "@/lib/razborProducts";
import { readDocToken } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: DOC_PAGE.compat.title,
  description: DOC_PAGE.compat.description,
  robots: { index: false, follow: false },
};

/** Совместимость из пакета «разбор + совместимость»: /r/<номер заказа>/para (разбор — /r/<номер заказа>). */
export default async function PackPairPage({ params }: PageProps<"/r/[id]/para">) {
  const { id } = await params;
  const order = await getOrder(id.slice(0, 64));
  const t = order?.status === "paid" && productOf(order.product) === "pack" && order.token2 ? readDocToken(order.token2) : null;
  if (!t || t.p !== "compat") notFound();

  return (
    <RazborResult
      kind="compat"
      doc={buildDoc(t)}
      gift={null}
      extra={<PackLink href={`/r/${id}`} label="разбор по дате рождения" />}
      note={<p className="no-print text-sm text-muted mt-3">Ссылка постоянная — добавь в закладки. Она же пришла тебе на почту; если она потеряется — <Link href="/razbor#dostup" className="underline">пришлём ещё раз</Link>.</p>}
    />
  );
}
