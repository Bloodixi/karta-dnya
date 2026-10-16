import Link from "next/link";
import { SOCIAL } from "@/lib/site";

/** Ссылка «подарить разбор» с меткой источника: письмо (email) или страница результата (result). */
export const giftHref = (source: "email" | "result") => `/razbor?utm_source=${source}&utm_medium=razbor&utm_campaign=gift`;

/** Блок в конце оплаченного разбора: подарок близкому, канал «Карта дня», подсказка про закладки. Без счётчиков. */
export default function RazborShare() {
  return (
    <section className="no-print card mt-12 max-w-3xl p-5 md:p-6" aria-label="Что дальше">
      <h2 className="text-xl">Поделиться и не потерять</h2>
      <p className="mt-2 text-muted">Ссылка постоянная — добавь эту страницу в закладки, и разбор будет под рукой.</p>
      <p className="mt-2 text-muted">Если хочется сделать приятное близкому человеку, разбор можно подарить: достаточно его даты рождения.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={giftHref("result")} className="btn">Подарить разбор близкому</Link>
        <a href={SOCIAL.telegram.url} className="btn btn-ghost" target="_blank" rel="noopener noreferrer">
          Канал «Карта дня» в Telegram
        </a>
      </div>
    </section>
  );
}
