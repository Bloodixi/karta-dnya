"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type ShowcaseStone = { slug: string; name: string; color: string; properties: string[]; zodiac: string[]; colors: string[]; thumb: string | null };
export type ShowcaseColor = { key: string; label: string; swatch: string };
export type ShowcaseSign = { slug: string; name: string; symbol: string; order: string[] };

const plural = (n: number) => {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return "камень";
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "камня";
  return "камней";
};

/** Круглая «линза» на тёмной подложке: фото разных авторов и фонов выглядят одной серией. */
function Plinth({ s, n, colors }: { s: ShowcaseStone; n: number; colors: ShowcaseColor[] }) {
  return (
    <span
      className="relative block aspect-square overflow-hidden"
      style={{ background: "radial-gradient(75% 65% at 50% 40%, var(--night-2) 0%, var(--night) 72%)" }}
    >
      <span className="absolute left-2.5 top-2 sm:left-3 sm:top-2.5 font-mono text-[0.65rem] tracking-[0.08em]" style={{ color: "var(--night-muted)" }}>
        {String(n).padStart(2, "0")}
      </span>
      {colors.length > 0 && (
        <span className="absolute right-2.5 top-2.5 sm:right-3 sm:top-3 flex -space-x-1" aria-hidden="true">
          {colors.slice(0, 3).map((c) => (
            <span key={c.key} className="w-2.5 h-2.5 rounded-full" style={{ background: c.swatch, boxShadow: "0 0 0 1px var(--night), 0 0 0 2px rgba(236,233,241,0.28)" }} />
          ))}
        </span>
      )}
      <span
        aria-hidden="true"
        className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-[52%] h-[7%] rounded-[50%] blur-md"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />
      <span
        className="absolute left-1/2 top-[47%] -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full overflow-hidden"
        style={{
          background: "var(--night-2)",
          boxShadow:
            "0 0 0 1px color-mix(in oklab, var(--gold) 75%, transparent), 0 0 0 5px var(--night), 0 0 0 6px color-mix(in oklab, var(--gold) 30%, transparent), 0 22px 34px -14px rgba(0,0,0,0.85)",
        }}
      >
        {s.thumb && (
          // eslint-disable-next-line @next/next/no-img-element -- миниатюры уже подготовлены, без оптимизатора
          <img
            src={s.thumb}
            width={400}
            height={300}
            alt={`${s.name}: фото`}
            loading="lazy"
            decoding="async"
            className="block w-full h-full object-cover scale-[1.15] transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.24]"
            style={{ filter: "saturate(1.06) contrast(1.05) brightness(0.94)" }}
          />
        )}
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(circle at 38% 30%, rgba(255,255,255,0.16) 0%, transparent 38%), radial-gradient(circle, transparent 55%, rgba(0,0,0,0.45) 100%)" }}
        />
      </span>
    </span>
  );
}

const chipBase =
  "chip shrink-0 snap-start min-h-10 cursor-pointer select-none hover:text-ink hover:border-gold aria-pressed:bg-ink aria-pressed:border-ink aria-pressed:text-bg";

/** Витрина каталога камней: тёмные подложки под фото, сетка 2/3/4 и клиентский фильтр по цвету и знаку. */
export default function StoneShowcase({ stones, colors, signs }: { stones: ShowcaseStone[]; colors: ShowcaseColor[]; signs: ShowcaseSign[] }) {
  const [color, setColor] = useState<string | null>(null);
  const [sign, setSign] = useState<string | null>(null);
  const colorMap = useMemo(() => Object.fromEntries(colors.map((c) => [c.key, c])), [colors]);
  const activeSign = signs.find((z) => z.slug === sign) || null;

  const shown = useMemo(() => {
    let list = stones.filter((s) => (!color || s.colors.includes(color)) && (!sign || s.zodiac.includes(sign)));
    if (activeSign) {
      const rank = (slug: string) => { const i = activeSign.order.indexOf(slug); return i < 0 ? 99 : i; };
      list = [...list].sort((a, b) => rank(a.slug) - rank(b.slug));
    }
    return list;
  }, [stones, color, sign, activeSign]);

  const numberOf = useMemo(() => Object.fromEntries(stones.map((s, i) => [s.slug, i + 1])), [stones]);
  const filtered = Boolean(color || sign);
  const reset = () => { setColor(null); setSign(null); };

  return (
    <section aria-label="Каталог камней" className="mt-8">
      <div className="card p-3 sm:p-4">
        <div className="flex items-baseline gap-3">
          <p className="mono shrink-0 w-14">Цвет</p>
          <div role="group" aria-label="Фильтр по цвету" className="-mr-3 sm:mr-0 pr-3 sm:pr-0 flex gap-1.5 sm:gap-2 overflow-x-auto sm:flex-wrap snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0">
            {colors.map((c) => (
              <button key={c.key} type="button" aria-pressed={color === c.key} onClick={() => setColor(color === c.key ? null : c.key)} className={chipBase}>
                <span aria-hidden="true" className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.swatch, boxShadow: "0 0 0 1px var(--line)" }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-line flex items-baseline gap-3">
          <p className="mono shrink-0 w-14">Знак</p>
          <div role="group" aria-label="Фильтр по знаку зодиака" className="-mr-3 sm:mr-0 pr-3 sm:pr-0 flex gap-1.5 sm:gap-2 overflow-x-auto sm:flex-wrap snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-w-0">
            {signs.map((z) => (
              <button key={z.slug} type="button" aria-pressed={sign === z.slug} onClick={() => setSign(sign === z.slug ? null : z.slug)} className={chipBase}>
                <span aria-hidden="true" className="text-[0.95rem] leading-none normal-case" style={{ fontFamily: "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',serif" }}>
                  {z.symbol}{"︎"}
                </span>
                {z.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 min-h-10">
        <p className="mono" aria-live="polite">
          {filtered ? `Найдено: ${shown.length} ${plural(shown.length)}` : `В каталоге ${stones.length} ${plural(stones.length)}`}
          {colorMap[color || ""] ? ` · ${colorMap[color || ""].label.toLowerCase()}` : ""}
          {activeSign ? ` · ${activeSign.name}` : ""}
        </p>
        {filtered && (
          <button type="button" onClick={reset} className="mono underline underline-offset-4 hover:text-ink min-h-10">
            Сбросить
          </button>
        )}
        {activeSign && (
          <Link href={`/kamni/po-znaku-zodiaka/${activeSign.slug}`} className="mono text-accent-text underline underline-offset-4 hover:text-ink sm:ml-auto min-h-10 inline-flex items-center">
            Подробно: камни для знака {activeSign.name} →
          </Link>
        )}
      </div>

      {shown.length ? (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((s) => (
            <li key={s.slug} className="min-w-0">
              <Link href={`/kamni/${s.slug}`} className="group card card-hover overflow-hidden flex flex-col h-full">
                <Plinth s={s} n={numberOf[s.slug]} colors={s.colors.map((k) => colorMap[k]).filter(Boolean)} />
                <span className="p-3 sm:p-4 flex flex-col min-w-0 border-t border-line">
                  <span className="display text-lg sm:text-xl leading-tight">{s.name}</span>
                  <span className="mono mt-1 line-clamp-1 !text-[0.62rem] sm:!text-[0.68rem]">{s.color}</span>
                  <span className="text-xs sm:text-sm text-muted mt-1.5 sm:mt-2 line-clamp-2">{s.properties.slice(0, 3).join(", ")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-3 p-6 text-center">
          <p className="text-muted">Камней с таким сочетанием цвета и знака в каталоге нет.</p>
          <button type="button" onClick={reset} className="btn mt-4">Показать все камни</button>
        </div>
      )}
    </section>
  );
}
