"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function DreamSearch({ items }: { items: { slug: string; word: string; short: string }[] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? items.filter((d) => d.word.toLowerCase().includes(s) || d.short.toLowerCase().includes(s)) : items;
  }, [q, items]);
  return (
    <div>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="К чему снится… например, змея"
        aria-label="Поиск по соннику"
        className="w-full max-w-xl border border-line rounded-full px-5 py-3 bg-surface"
      />
      <p className="text-xs text-muted mt-2">Символов: {list.length}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((d) => (
          <Link key={d.slug} href={`/sonnik/${d.slug}`} className="card card-hover p-4">
            <p className="font-semibold">{d.word}</p>
            <p className="text-sm text-muted mt-1 line-clamp-2">{d.short}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
