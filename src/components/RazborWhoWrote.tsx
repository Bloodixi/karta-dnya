import type { ReactNode } from "react";
import Link from "next/link";
import { horoscopeAuthor } from "@/lib/authors";
import { SITE } from "@/lib/site";

/**
 * «Кто составлял» — блок доверия в карточке цены платных продуктов (разбор, совместимость, детский разбор).
 * Автор гороскопов вместе с редакцией (решение владельца 17.10.2026; стаж в нумерологии не приписываем).
 * `what` — родительный падеж продукта: «разбора», «совместимости». `compact` — без абзаца о методе (для боковой карточки).
 */
export default function RazborWhoWrote({ what = "разбора", compact = false, className = "" }: { what?: string; compact?: boolean; className?: string }) {
  const a = horoscopeAuthor();
  return (
    <div className={`mt-6 border-t border-line pt-4 text-sm text-muted ${className}`}>
      <p className="mono !text-ink">Кто составлял</p>
      {a ? (
        <div className="flex items-center gap-3 mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.photo} alt={a.name} width={48} height={48} loading="lazy" className="w-12 h-12 rounded-full object-cover shrink-0" />
          <p>
            Тексты {what} подготовила <Link href={`/avtory/${a.slug}`} className="underline text-ink">{a.name}</Link>, автор гороскопов «{SITE.name}», вместе с редакцией.
          </p>
        </div>
      ) : null}
      {compact ? null : (
        <p className="mt-2">
          Основа — классическая пифагорейская нумерология. Числа считаются по тем же правилам, что в калькуляторах{" "}
          <Link href="/chislo-sudby" className="underline">числа судьбы</Link> и <Link href="/kvadrat-pifagora" className="underline">квадрата Пифагора</Link>, а расчёт каждого числа показан в самом {what === "разбора" ? "разборе" : "тексте"}.
        </p>
      )}
    </div>
  );
}

/**
 * Боковая карточка цены на десктопе (lg+): держит предложение в поле зрения, пока читаешь страницу.
 * На телефоне скрыта — там карточка оплаты идёт в потоке, а внизу липкая кнопка.
 */
export function RazborPriceAside({ title, price, points, href, cta, what }: { title: string; price: number; points: ReactNode[]; href: string; cta: string; what?: string }) {
  return (
    <aside aria-label={title} className="hidden lg:block lg:sticky lg:top-24 no-print">
      <div className="card p-6 frame-gold">
        <p className="mono">{title}</p>
        <p className="display text-4xl mt-2">{price} ₽</p>
        <ul className="mt-4 grid gap-1.5 text-sm">
          {points.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
        <a href={href} className="btn btn-lg w-full mt-5">
          {cta}
        </a>
        <RazborWhoWrote what={what} compact />
      </div>
    </aside>
  );
}
