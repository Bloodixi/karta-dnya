"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { prepare, search, type SearchIndex } from "@/lib/search";

const HINTS = ["карта дня", "змея", "Овен", "аметист", "число 7", "Шут", "руна Феху"];

/** Поле поиска и результаты. Индекс (/poisk-index.json) грузится один раз; запрос сохраняется в адресе (?q=) без перезагрузки. */
export default function SiteSearch({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/poisk-index.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: SearchIndex) => { if (alive) setIndex(data); })
      .catch(() => { if (alive) setFailed(true); });
    if (!initialQuery) input.current?.focus();
    return () => { alive = false; };
  }, [initialQuery]);

  // Запрос — в адрес, чтобы результатом можно было поделиться и вернуться к нему кнопкой «Назад».
  useEffect(() => {
    const t = setTimeout(() => {
      const url = new URL(window.location.href);
      const v = q.trim();
      if ((url.searchParams.get("q") ?? "") === v) return;
      if (v) url.searchParams.set("q", v);
      else url.searchParams.delete("q");
      window.history.replaceState(window.history.state, "", url);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  const prepared = useMemo(() => (index ? prepare(index) : null), [index]);
  const hits = useMemo(() => (prepared && index ? search(prepared, index.sections, q) : []), [prepared, index, q]);
  const query = q.trim();

  return (
    <div>
      <form role="search" action="/poisk" onSubmit={(e) => { e.preventDefault(); input.current?.blur(); }}>
        <label htmlFor="site-search" className="sr-only">Поиск по сайту</label>
        <input
          ref={input}
          id="site-search"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Карта, знак, сон, камень, число…"
          enterKeyHint="search"
          autoComplete="off"
          className="w-full max-w-2xl border border-line rounded-sm px-4 py-3 text-lg bg-surface focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </form>

      <p className="mono mt-2" aria-live="polite">
        {failed ? "Поиск сейчас недоступен — обновите страницу" : !index ? (query ? "Ищем…" : "") : query ? `Найдено: ${hits.length}${hits.length === 50 ? "+" : ""}` : ""}
      </p>

      {query && index && hits.length > 0 && (
        <ul className="mt-4 grid gap-2 max-w-3xl">
          {hits.map((h) => (
            <li key={h.url}>
              <Link href={h.url} className="card card-hover px-4 py-3 flex items-baseline justify-between gap-4">
                <span className="font-medium leading-snug min-w-0">{h.title}</span>
                <span className="mono shrink-0">{h.section}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {(!query || (index && hits.length === 0)) && (
        <div className="mt-6">
          {query && <p className="text-muted">По запросу «{query}» ничего не нашлось. Проверьте написание или попробуйте одно слово.</p>}
          <p className="text-sm text-muted mt-2">Например:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HINTS.map((h) => (
              <button key={h} type="button" onClick={() => setQ(h)} className="chip min-h-10 hover:text-ink hover:border-gold">
                {h}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
