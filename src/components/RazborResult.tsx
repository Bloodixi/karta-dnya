import type { ReactNode } from "react";
import Link from "next/link";
import RazborGiftNote from "@/components/RazborGiftNote";
import RazborShare from "@/components/RazborShare";
import RazborView from "@/components/RazborView";
import { CopyLinkButton, PdfLink, PrintButton } from "@/components/RazborClient";
import type { RazborDoc } from "@/lib/razbor";
import type { GiftView } from "@/lib/razborGift";
import { DOC_PAGE } from "@/lib/razborProducts";
import type { DocToken } from "@/lib/razborToken";
import { SITE } from "@/lib/site";

/**
 * Страница оплаченного документа (длинная и короткая ссылки): разбор, совместимость пары или детский разбор.
 * Буклет для печати — только у обычного разбора (bookletHref).
 */
export default function RazborResult({ kind, doc, gift, bookletHref, note, extra }: { kind: DocToken["p"]; doc: RazborDoc; gift: GiftView | null; bookletHref?: string; note: ReactNode; extra?: ReactNode }) {
  const t = DOC_PAGE[kind];
  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <header className="max-w-3xl">
        <p className="mono">
          {SITE.name} · {t.kicker}
        </p>
        <h1 className="text-3xl md:text-4xl mt-2">{doc.title}</h1>
        <p className="text-lg mt-3">
          {doc.who ? <>{doc.who} · </> : null}
          {t.dates} {doc.date}
        </p>
        <div className="no-print mt-5 flex flex-wrap gap-2">
          {bookletHref ? (
            <Link href={bookletHref} className="btn">
              Буклет для печати
            </Link>
          ) : null}
          {/* у разбора — готовый PDF буклета с сервера; у совместимости и детского — печать страницы */}
          {bookletHref ? <PdfLink href={`${bookletHref}/pdf`} className="btn btn-ghost" /> : <PrintButton />}
          <CopyLinkButton />
        </div>
        {gift ? <RazborGiftNote gift={gift} /> : null}
        {extra}
        {note}
      </header>

      <div className="mt-8">
        <RazborView sections={doc.sections} />
      </div>

      <RazborShare />

      <footer className="mt-12 max-w-3xl border-t border-line pt-6 text-sm text-muted">
        <p>{t.disclaimer}</p>
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

/** Плашка пакета: вторая ссылка заказа (совместимость из разбора или разбор из совместимости). */
export function PackLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="no-print mt-4 rounded-lg border border-line bg-surface p-3 text-sm">
      В заказ входит ещё один документ: <Link href={href} className="text-accent underline">{label}</Link>
    </p>
  );
}
