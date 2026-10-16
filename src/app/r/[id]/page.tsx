import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RazborGiftNote from "@/components/RazborGiftNote";
import RazborShare from "@/components/RazborShare";
import RazborView from "@/components/RazborView";
import { CopyLinkButton, PdfLink } from "@/components/RazborClient";
import { buildRazbor, RAZBOR } from "@/lib/razbor";
import { giftFor } from "@/lib/razborGift";
import { readToken } from "@/lib/razborToken";
import { getOrder } from "@/lib/razborStore";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: RAZBOR.title,
  description: "Личный нумерологический разбор по дате рождения: числа, квадрат Пифагора, личный год и прогноз на двенадцать месяцев. Страница доступна только по ссылке.",
  robots: { index: false, follow: false },
};

/** Короткая ссылка на оплаченный разбор: /r/<номер заказа>. Номер случайный (72 бита), его знает только покупатель. */
export default async function RazborShortPage({ params }: PageProps<"/r/[id]">) {
  const { id } = await params;
  const order = await getOrder(id.slice(0, 64));
  const input = order?.status === "paid" ? readToken(order.token) : null;
  if (!input) notFound();
  const doc = buildRazbor(input);
  const gift = await giftFor(order!);

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <header className="max-w-3xl">
        <p className="mono">
          {SITE.name} · личный разбор
        </p>
        <h1 className="text-3xl md:text-4xl mt-2">{doc.title}</h1>
        <p className="text-lg mt-3">
          {doc.who ? <>{doc.who} · </> : null}дата рождения {doc.date}
        </p>
        <div className="no-print mt-5 flex flex-wrap gap-2">
          <Link href={`/r/${id}/buklet`} className="btn">
            Буклет для печати
          </Link>
          <PdfLink href={`/r/${id}/buklet/pdf`} className="btn btn-ghost" />
          <CopyLinkButton />
        </div>
        {gift ? <RazborGiftNote gift={gift} /> : null}
        {gift ? (
          <p className="no-print text-sm text-muted mt-3">Ссылка постоянная — сохрани письмо с ней или добавь эту страницу в закладки: разбор откроется в любой момент и на любом устройстве.</p>
        ) : (
          <p className="no-print text-sm text-muted mt-3">Ссылка постоянная — добавь в закладки. Она же пришла тебе на почту; если она потеряется — <Link href="/razbor#dostup" className="underline">пришлём ещё раз</Link>.</p>
        )}
      </header>

      <div className="mt-8">
        <RazborView sections={doc.sections} />
      </div>

      <RazborShare />

      <footer className="mt-12 max-w-3xl border-t border-line pt-6 text-sm text-muted">
        <p>Разбор носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за тобой.</p>
        <p className="no-print mt-3">
          <Link href="/numerologiya" className="text-accent underline">Нумерология на сайте</Link>
          {gift ? null : (
            <>
              {" "}· <Link href="/vozvrat" className="text-accent underline">Если что-то пошло не так</Link>
            </>
          )}
        </p>
      </footer>
    </article>
  );
}
