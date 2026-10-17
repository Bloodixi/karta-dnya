"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { reachGoal } from "./MetrikaCounter";

export type DreamItem = { slug: string; word: string; short: string; thumb?: string };

const ANCHOR: Record<string, string> = {
  А: "a", Б: "b", В: "v", Г: "g", Д: "d", Е: "e", Ё: "yo", Ж: "zh", З: "z", И: "i", Й: "y", К: "k", Л: "l", М: "m", Н: "n", О: "o",
  П: "p", Р: "r", С: "s", Т: "t", У: "u", Ф: "f", Х: "h", Ц: "ts", Ч: "ch", Ш: "sh", Щ: "shch", Э: "eh", Ю: "yu", Я: "ya",
};

export function letterAnchor(letter: string) {
  return ANCHOR[letter] || letter.toLowerCase();
}

export function groupByLetter(items: DreamItem[]) {
  const groups = new Map<string, DreamItem[]>();
  for (const d of items) {
    const l = d.word.charAt(0).toUpperCase();
    const g = groups.get(l);
    if (g) g.push(d);
    else groups.set(l, [d]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "ru"));
}

function plural(n: number) {
  const r10 = n % 10, r100 = n % 100;
  const word = r10 === 1 && r100 !== 11 ? "символ" : r10 >= 2 && r10 <= 4 && (r100 < 10 || r100 >= 20) ? "символа" : "символов";
  return `${n} ${word}`;
}

function DreamCard({ d }: { d: DreamItem }) {
  return (
    <Link href={`/sonnik/${d.slug}`} className="card card-hover p-3 flex gap-3 items-center">
      {d.thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.thumb} width={96} height={72} alt="" loading="lazy" decoding="async" className="w-24 h-18 shrink-0 rounded-sm object-cover aspect-[4/3]" />
      )}
      <span className="min-w-0">
        <p className="font-semibold">{d.word}</p>
        <p className="text-sm text-muted mt-1 line-clamp-2">{d.short}</p>
      </span>
    </Link>
  );
}

const HINTS = ["вода", "кошка", "дорога"];

/**
 * Поиск по соннику и список символов по алфавиту. Поле поиска стоит первым, чтобы на телефоне оно было на первом экране;
 * `intro` (например, «Популярные сны») и `listHeading` показываются между полем и алфавитом, пока не идёт поиск.
 */
export default function DreamSearch({ items, intro, listHeading }: { items: DreamItem[]; intro?: ReactNode; listHeading?: ReactNode }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const groups = useMemo(() => groupByLetter(items), [items]);
  const found = useMemo(() => (s ? items.filter((d) => d.word.toLowerCase().includes(s) || d.short.toLowerCase().includes(s)) : items), [s, items]);

  // Ненайденные запросы — в Метрику (цель sonnik_notfound): какие символы добавить в сонник.
  // Дебаунс 1,5 с, чтобы не слать каждую букву; один и тот же запрос — один раз за визит.
  const sentNotFound = useRef(new Set<string>());
  const nothing = s.length >= 3 && found.length === 0;
  useEffect(() => {
    if (!nothing || sentNotFound.current.has(s)) return;
    const t = setTimeout(() => {
      sentNotFound.current.add(s);
      reachGoal("sonnik_notfound", { q: s.slice(0, 100) });
    }, 1500);
    return () => clearTimeout(t);
  }, [nothing, s]);

  // Поле поиска залипает под шапкой сайта. Метка-«датчик» над полем: когда она уходит под шапку, у полосы появляется нижняя линия.
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  // Высота шапки: на средних экранах меню может перенестись во вторую строку, поэтому меряем, а классы top-* — запасной вариант до гидратации.
  const [headerH, setHeaderH] = useState<number | null>(null);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>("body > header");
    if (!header) return;
    const measure = () => setHeaderH(header.offsetHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || headerH === null || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < headerH + 1), { rootMargin: `-${headerH + 1}px 0px 0px 0px` });
    io.observe(el);
    return () => io.disconnect();
  }, [headerH]);

  const onQuery = (value: string) => {
    setQ(value);
    // Если поле уже залипло (листали длинный список), список под ним меняется — возвращаем начало результатов к полю.
    const el = sentinel.current;
    if (stuck && el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - (headerH ?? 0) });
  };

  return (
    <div>
      <div ref={sentinel} aria-hidden="true" />
      <div
        className={`sticky top-[61px] md:top-[69px] z-10 -mx-4 px-4 py-2 bg-bg/90 backdrop-blur border-b ${stuck ? "border-line" : "border-transparent"}`}
        style={headerH !== null ? { top: headerH } : undefined}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="К чему снится… например, змея"
          aria-label="Поиск по соннику"
          enterKeyHint="search"
          className="w-full max-w-xl border border-line rounded-sm px-4 py-3 bg-surface focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>
      <p className="mono mt-1" aria-live="polite">
        {s ? `Найдено: ${found.length}` : `Символов: ${items.length} · букв: ${groups.length}`}
      </p>

      {s ? (
        found.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((d) => <DreamCard key={d.slug} d={d} />)}
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-muted">Такого символа пока нет. Попробуйте другое слово, например:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {HINTS.map((h) => (
                <button key={h} type="button" onClick={() => onQuery(h)} className="chip min-h-10 hover:text-ink hover:border-gold">
                  {h}
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <>
          {intro}
          {listHeading}
          <nav aria-label="Символы по алфавиту" className="flex flex-wrap gap-1.5">
            {groups.map(([letter]) => (
              <a key={letter} href={`#${letterAnchor(letter)}`} className="chip hover:text-ink hover:border-gold min-w-10 h-10 justify-center">
                {letter}
              </a>
            ))}
          </nav>
          {groups.map(([letter, list]) => (
            // content-visibility: буквы ниже экрана не рисуются и не грузят миниатюры, пока до них не долистали
            <section key={letter} id={letterAnchor(letter)} className="mt-10 scroll-mt-36 md:scroll-mt-40 [content-visibility:auto] [contain-intrinsic-size:auto_640px]">
              <div className="ornament mb-3 border-b border-line pb-2">
                <h2 className="text-3xl">{letter}</h2>
                <span className="mono">{plural(list.length)}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((d) => <DreamCard key={d.slug} d={d} />)}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
