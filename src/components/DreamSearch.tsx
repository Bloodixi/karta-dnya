"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
        <img src={d.thumb} width={96} height={72} alt="" loading="lazy" decoding="async" className="w-24 h-18 shrink-0 rounded-lg object-cover aspect-[4/3]" />
      )}
      <span>
        <p className="font-semibold">{d.word}</p>
        <p className="text-sm text-muted mt-1 line-clamp-2">{d.short}</p>
      </span>
    </Link>
  );
}

export default function DreamSearch({ items }: { items: DreamItem[] }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const groups = useMemo(() => groupByLetter(items), [items]);
  const found = useMemo(() => (s ? items.filter((d) => d.word.toLowerCase().includes(s) || d.short.toLowerCase().includes(s)) : items), [s, items]);

  return (
    <div>
      <nav aria-label="Символы по алфавиту" className="flex flex-wrap gap-1.5">
        {groups.map(([letter]) => (
          <a key={letter} href={`#${letterAnchor(letter)}`} onClick={() => setQ("")} className="chip hover:text-ink hover:border-gold min-w-9 justify-center">
            {letter}
          </a>
        ))}
      </nav>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="К чему снится… например, змея"
        aria-label="Поиск по соннику"
        className="w-full max-w-xl border border-line rounded-full px-5 py-3 bg-surface mt-5"
      />
      <p className="mono mt-3" aria-live="polite">
        {s ? `Найдено: ${found.length}` : `Символов: ${items.length} · букв: ${groups.length}`}
      </p>

      {s ? (
        found.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((d) => <DreamCard key={d.slug} d={d} />)}
          </div>
        ) : (
          <p className="text-muted mt-4">Такого символа пока нет. Попробуйте другое слово: например, «вода», «кошка» или «дорога».</p>
        )
      ) : (
        groups.map(([letter, list]) => (
          <section key={letter} id={letterAnchor(letter)} className="mt-10 scroll-mt-24">
            <div className="ornament mb-3 border-b border-line pb-2">
              <h2 className="text-3xl">{letter}</h2>
              <span className="mono">{plural(list.length)}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((d) => <DreamCard key={d.slug} d={d} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
