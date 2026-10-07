"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cityLabel, indexCities, searchCities, type City, type IndexedCity } from "@/lib/astro/cities";

/** Форма «восходящий знак»: результат считает сервер по ?d=&t=&c=, форма работает и без JS (GET с названием города).
 *  Путь продублирован строкой: экспорт констант из client-модуля на сервере превращается в client-ссылку, а не в строку. */
const ASC_PATH = "/astrologiya/voshodyaschiy-znak";

let citiesPromise: Promise<IndexedCity[]> | null = null;
function loadCities(): Promise<IndexedCity[]> {
  citiesPromise ??= import("../../content/data/astro/cities.json").then((m) => indexCities(((m as { default?: City[] }).default ?? (m as unknown as City[])) as City[]));
  return citiesPromise;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function AscForm({ initial }: { initial?: { date?: string; time?: string; city?: string; citySlug?: string } }) {
  const router = useRouter();
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "");
  const [cityQuery, setCityQuery] = useState(initial?.city ?? "");
  const [citySlug, setCitySlug] = useState(initial?.citySlug ?? "");
  const [hints, setHints] = useState<IndexedCity[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function onCityInput(v: string) {
    setCityQuery(v);
    setCitySlug("");
    const idx = await loadCities();
    const list = searchCities(idx, v, 8);
    setHints(list);
    setOpen(list.length > 0);
  }

  function pickCity(c: IndexedCity) {
    setCitySlug(c.slug);
    setCityQuery(cityLabel(c));
    setHints([]);
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (!y || y < 1800 || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d || date > todayIso()) {
      setError("Введите настоящую дату рождения.");
      return;
    }
    if (!/^\d{1,2}:\d{2}$/.test(time)) {
      setError("Введите время рождения: без него восходящий знак не определить.");
      return;
    }
    let slug = citySlug;
    if (!slug) {
      const idx = await loadCities();
      const found = searchCities(idx, cityQuery.split(",")[0], 1)[0];
      if (found) { pickCity(found); slug = found.slug; }
    }
    if (!slug) {
      setError("Выберите город из списка подсказок: начните вводить название.");
      return;
    }
    setError("");
    router.push(`${ASC_PATH}?${new URLSearchParams({ d: date, t: time, c: slug }).toString()}`);
  }

  return (
    <form method="get" action={ASC_PATH} onSubmit={onSubmit} className="card p-6 grid gap-4 sm:grid-cols-2" noValidate>
      <label className="grid gap-1 text-sm">
        Дата рождения
        <input type="date" name="d" value={date} onChange={(e) => setDate(e.target.value)} required min="1800-01-01" max={todayIso()} className="border border-line rounded-lg px-3 py-2 bg-surface" />
      </label>
      <label className="grid gap-1 text-sm">
        Время рождения
        <input type="time" name="t" value={time} onChange={(e) => setTime(e.target.value)} required className="border border-line rounded-lg px-3 py-2 bg-surface" />
      </label>
      <div className="relative grid gap-1 text-sm sm:col-span-2">
        <label htmlFor="asc-city">Город рождения</label>
        <input
          id="asc-city"
          name="c"
          type="text"
          value={cityQuery}
          onChange={(e) => void onCityInput(e.target.value)}
          onFocus={() => { void loadCities(); if (hints.length) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Начните вводить: Москва, Минск, Алматы…"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="asc-city-list"
          aria-autocomplete="list"
          required
          className="border border-line rounded-lg px-3 py-2 bg-surface"
        />
        {open && (
          <ul id="asc-city-list" role="listbox" className="card absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto p-1 shadow-lg">
            {hints.map((c) => (
              <li key={c.slug} role="option" aria-selected={citySlug === c.slug}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickCity(c)} className="w-full text-left px-3 py-2 rounded hover:bg-sunk">
                  {c.name} <span className="text-muted">· {cityLabel(c).split(", ")[1]} · {c.tz}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
        <button type="submit" className="btn">Узнать восходящий знак</button>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </form>
  );
}
