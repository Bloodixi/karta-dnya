import { isValidElement, type ReactNode } from "react";
import Link from "next/link";
import { IconBadge, type IconName } from "@/components/Icons";
import RazborGiftNote from "@/components/RazborGiftNote";
import RazborShare from "@/components/RazborShare";
import RazborView from "@/components/RazborView";
import { CopyLinkButton, PdfLink, PrintButton } from "@/components/RazborClient";
import type { RazborDoc } from "@/lib/razbor";
import type { GiftView } from "@/lib/razborGift";
import { compatUpsellPath, DOC_PAGE, PRODUCTS } from "@/lib/razborProducts";
import type { DocToken } from "@/lib/razborToken";
import { SITE } from "@/lib/site";

/**
 * Страница оплаченного документа (длинная и короткая ссылки): разбор, совместимость пары или детский разбор.
 * Буклет для печати — только у обычного разбора (bookletHref).
 */
export default function RazborResult({ kind, doc, gift, bookletHref, note, extra, owned }: { kind: DocToken["p"]; doc: RazborDoc; gift: GiftView | null; bookletHref?: string; note: ReactNode; extra?: ReactNode; owned?: DocToken["p"][] }) {
  const t = DOC_PAGE[kind];
  // что уже куплено: этот документ, а в пакете (на странице есть плашка PackLink) — разбор и совместимость
  const pack = isValidElement(extra) && extra.type === PackLink;
  const have = owned ?? (pack ? ["razbor", "compat"] : [kind]);
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

      <RazborMore kind={kind} date={doc.date} have={have} />

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

/** Первая дата документа (дд.мм.гггг, у пары — первая из двух) → ГГГГ-ММ-ДД. */
function firstIso(date: string): string {
  const m = /(\d{2})\.(\d{2})\.(\d{4})/.exec(date);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
}

type More = { id: string; icon: IconName; label: string; title: string; text: string; price: number; href: string };

/**
 * Допродажи после покупки: другие документы и подарок, без того, что уже куплено.
 * Дата покупателя подставляется туда, где она его: из разбора и из совместимости (первая дата),
 * но не из детского разбора — там дата ребёнка.
 */
function RazborMore({ kind, date, have }: { kind: DocToken["p"]; date: string; have: DocToken["p"][] }) {
  const iso = kind === "child" ? "" : firstIso(date);
  const items: More[] = [];
  if (!have.includes("razbor"))
    items.push({ id: "razbor", icon: "hash", label: "для себя", title: "Личный разбор", text: "Число судьбы, квадрат Пифагора, личный год и двенадцать месяцев вперёд.", price: PRODUCTS.razbor.price, href: iso ? `/razbor?d=${iso}#razbor-teaser` : "/razbor#forma" });
  if (!have.includes("compat"))
    items.push({ id: "compat", icon: "hearts", label: "для двоих", title: "Совместимость пары", text: iso ? "Твоя дата уже в форме — останется добавить дату партнёра." : "Две даты рождения: образ пары, любовь, быт, общий год и три совета.", price: PRODUCTS.compat.price, href: `${iso ? compatUpsellPath(iso) : PRODUCTS.compat.path}#forma` });
  if (!have.includes("child"))
    items.push({ id: "child", icon: "sun", label: "для родителя", title: "Детский разбор", text: "Характер ребёнка, сильные стороны и как поддержать его в разном возрасте.", price: PRODUCTS.child.price, href: `${PRODUCTS.child.path}#forma` });
  items.push({ id: "gift", icon: "star", label: "в подарок", title: "Подарить разбор", text: "С подписью и пожеланием, письмо получателю — сразу или в выбранный день.", price: PRODUCTS.razbor.price, href: "/razbor?g=1#forma" });

  return (
    <section aria-labelledby="razbor-more" className="no-print mt-12 max-w-4xl border-t border-line pt-8">
      <p className="mono">Ещё по датам рождения</p>
      <h2 id="razbor-more" className="display text-2xl mt-1">Что можно открыть дальше</h2>
      <ul className={`mt-5 grid gap-3 sm:grid-cols-2 ${items.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {items.map((it) => (
          <li key={it.id} className="min-w-0">
            <Link href={it.href} className="card card-hover p-5 h-full flex flex-col gap-3">
              <span className="flex items-center gap-3">
                <IconBadge name={it.icon} />
                <span className="mono">{it.label}</span>
              </span>
              <span className="display text-xl leading-tight">{it.title}</span>
              <span className="text-sm text-muted flex-1">{it.text}</span>
              <span className="flex items-baseline justify-between gap-3 border-t border-line pt-3 text-sm">
                <span className="tabular-nums">{it.price} ₽</span>
                <span className="text-accent-text">Подробнее →</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
