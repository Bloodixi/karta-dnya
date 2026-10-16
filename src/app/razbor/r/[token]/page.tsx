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

export default async function RazborResultPage({ params }: PageProps<"/razbor/r/[token]">) {
  const { token } = await params;
  const input = readToken(decodeURIComponent(token));
  if (!input) notFound();
  // в новых ссылках есть номер заказа: после возврата или отмены ссылка закрыта (старые ссылки номера не содержат)
  const order = input.order ? await getOrder(input.order) : null;
  if (order && (order.status === "refunded" || order.status === "canceled")) notFound();
  const doc = buildRazbor(input);
  const gift = order ? await giftFor(order) : null;

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
          <Link href={`/razbor/r/${token}/buklet`} className="btn">
            Буклет для печати
          </Link>
          <PdfLink href={`/razbor/r/${token}/buklet/pdf`} className="btn btn-ghost" />
          <CopyLinkButton />
        </div>
        {gift ? <RazborGiftNote gift={gift} /> : null}
        <p className="no-print text-sm text-muted mt-3">
          {gift ? "Ссылка постоянная — сохрани письмо с ней или добавь эту страницу в закладки: разбор откроется в любой момент и на любом устройстве." : "Ссылка постоянная — добавь в закладки. По ней разбор откроется в любой момент и на любом устройстве."}
        </p>
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
