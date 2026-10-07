"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import NatalWheel, { PLANET_GLYPH, SIGN_GLYPHS } from "./NatalWheel";
import { cityLabel, indexCities, searchCities, findCityBySlug, type City, type IndexedCity } from "@/lib/astro/cities";
import type { NatalChart } from "@/lib/astro/natal";
import type { AspectKind, Body, SignSlug } from "@/lib/astro/types";

/** Компактные справочники, которые страница передаёт из content/data (склонения для заголовков трактовок). */
export type NatalRefs = {
  signs: { slug: SignSlug; name: string; locative: string }[];
  planets: { body: Body; name: string; instrumental: string }[];
  aspects: { kind: AspectKind; name: string; withText: string }[];
};

type NatalTexts = {
  planetSign: Record<string, Record<string, string>>;
  planetHouse: Record<string, Record<string, string>>;
  asc: Record<string, string>;
  aspects: { a: Body; b: Body; nature: "conjunction" | "harmonious" | "tense"; text: string }[];
};

const HOUSE_TITLES = ["Личность", "Ресурсы", "Общение", "Дом и семья", "Творчество и любовь", "Работа и режим", "Партнёрство", "Перемены", "Путь и смысл", "Карьера", "Друзья и планы", "Уединение"];
const ORDINAL = ["1-м", "2-м", "3-м", "4-м", "5-м", "6-м", "7-м", "8-м", "9-м", "10-м", "11-м", "12-м"];
const SIGN_NAMES: Record<SignSlug, string> = {
  oven: "Овен", telets: "Телец", bliznetsy: "Близнецы", rak: "Рак", lev: "Лев", deva: "Дева",
  vesy: "Весы", skorpion: "Скорпион", strelets: "Стрелец", kozerog: "Козерог", vodoley: "Водолей", ryby: "Рыбы",
};

const todayIso = () => new Date().toISOString().slice(0, 10);

type Loaded = { natal: typeof import("@/lib/astro/natal"); texts: NatalTexts };
let loadedPromise: Promise<Loaded> | null = null;
function loadEngine(): Promise<Loaded> {
  loadedPromise ??= Promise.all([import("@/lib/astro/natal"), import("../../content/data/astro/natal-texts.json")]).then(([natal, texts]) => ({
    natal,
    texts: (texts as { default?: NatalTexts }).default ?? (texts as unknown as NatalTexts),
  }));
  return loadedPromise;
}

let citiesPromise: Promise<IndexedCity[]> | null = null;
function loadCities(): Promise<IndexedCity[]> {
  citiesPromise ??= import("../../content/data/astro/cities.json").then((m) => indexCities(((m as { default?: City[] }).default ?? (m as unknown as City[])) as City[]));
  return citiesPromise;
}

export default function NatalCalc({ refs }: { refs: NatalRefs }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [noTime, setNoTime] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [city, setCity] = useState<IndexedCity | null>(null);
  const [hints, setHints] = useState<IndexedCity[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ chart: NatalChart; texts: NatalTexts; natal: Loaded["natal"]; city: IndexedCity } | null>(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const compute = useCallback(async (d: string, t: string | null, c: IndexedCity, scroll: boolean) => {
    setBusy(true);
    setError("");
    try {
      const { natal, texts } = await loadEngine();
      const chart = natal.natalChart({ date: d, time: t, lat: c.lat, lon: c.lon, tz: c.tz });
      setResult({ chart, texts, natal, city: c });
      const q = new URLSearchParams({ d });
      if (t) q.set("t", t);
      q.set("c", c.slug);
      window.history.replaceState(null, "", `${window.location.pathname}?${q.toString()}`);
      if (scroll) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^natal: /, "") : "Не удалось рассчитать карту.");
      setResult(null);
    } finally {
      setBusy(false);
    }
  }, []);

  // Расчёт по ссылке вида ?d=1990-05-12&t=14:30&c=moskva
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const d = q.get("d");
    const c = q.get("c");
    if (!d || !c || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return;
    const t = q.get("t");
    const validTime = t && /^\d{1,2}:\d{2}$/.test(t) ? t : null;
    loadCities().then((idx) => {
      const found = findCityBySlug(idx, c);
      if (!found) return;
      setDate(d);
      setTime(validTime ?? "");
      setNoTime(!validTime);
      setCity(found);
      setCityQuery(cityLabel(found));
      void compute(d, validTime, found, false);
    });
  }, [compute]);

  async function onCityInput(v: string) {
    setCityQuery(v);
    setCity(null);
    const idx = await loadCities();
    const list = searchCities(idx, v, 8);
    setHints(list);
    setOpen(list.length > 0);
  }

  function pickCity(c: IndexedCity) {
    setCity(c);
    setCityQuery(cityLabel(c));
    setHints([]);
    setOpen(false);
  }

  async function onSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setCopied(false);
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (!y || y < 1800 || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d || date > todayIso()) {
      setError("Введите настоящую дату рождения.");
      return;
    }
    if (!noTime && !/^\d{1,2}:\d{2}$/.test(time)) {
      setError("Введите время рождения или отметьте «Не знаю время».");
      return;
    }
    let chosen = city;
    if (!chosen) {
      const idx = await loadCities();
      chosen = searchCities(idx, cityQuery, 1)[0] ?? null;
      if (chosen) pickCity(chosen);
    }
    if (!chosen) {
      setError("Выберите город из списка подсказок: начните вводить название.");
      return;
    }
    await compute(date, noTime ? null : time, chosen, true);
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="card p-6 grid gap-4 sm:grid-cols-2" noValidate>
        <label className="grid gap-1 text-sm">
          Дата рождения
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required min="1800-01-01" max={todayIso()} className="border border-line rounded-lg px-3 py-2 bg-surface" />
        </label>
        <div className="grid gap-1 text-sm">
          <label className="grid gap-1">
            Время рождения
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={noTime} className="border border-line rounded-lg px-3 py-2 bg-surface disabled:opacity-50" />
          </label>
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked={noTime} onChange={(e) => setNoTime(e.target.checked)} className="accent-accent" />
            Не знаю время рождения
          </label>
        </div>
        <div className="relative grid gap-1 text-sm sm:col-span-2">
          <label htmlFor="natal-city">Город рождения</label>
          <input
            id="natal-city"
            type="text"
            value={cityQuery}
            onChange={(e) => void onCityInput(e.target.value)}
            onFocus={() => { void loadCities(); if (hints.length) setOpen(true); }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Начните вводить: Москва, Минск, Алматы…"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="natal-city-list"
            aria-autocomplete="list"
            className="border border-line rounded-lg px-3 py-2 bg-surface"
          />
          {open && (
            <ul id="natal-city-list" role="listbox" className="card absolute left-0 right-0 top-full z-10 mt-1 max-h-64 overflow-auto p-1 shadow-lg">
              {hints.map((c) => (
                <li key={c.slug} role="option" aria-selected={city?.slug === c.slug}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pickCity(c)} className="w-full text-left px-3 py-2 rounded hover:bg-sunk">
                    {c.name} <span className="text-muted">· {cityLabel(c).split(", ")[1]} · {c.tz}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {city && <p className="text-xs text-muted">Координаты {city.lat.toFixed(2)}, {city.lon.toFixed(2)} · часовой пояс {city.tz}</p>}
        </div>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn" disabled={busy}>{busy ? "Считаем…" : "Рассчитать"}</button>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>
      </form>

      {result && <Result {...result} refs={refs} onShare={share} copied={copied} anchor={resultRef} />}
    </div>
  );
}

/* ------------------------------------------------------------------ результат */

function Result({ chart, texts, natal, city, refs, onShare, copied, anchor }: {
  chart: NatalChart; texts: NatalTexts; natal: Loaded["natal"]; city: IndexedCity; refs: NatalRefs;
  onShare: () => void; copied: boolean; anchor: React.RefObject<HTMLDivElement | null>;
}) {
  const sign = (slug: SignSlug) => refs.signs.find((s) => s.slug === slug);
  const planet = (b: Body) => refs.planets.find((p) => p.body === b);
  const aspectInfo = (k: AspectKind) => refs.aspects.find((a) => a.kind === k);
  const sun = chart.planets.find((p) => p.body === "sun")!;
  const moon = chart.planets.find((p) => p.body === "moon")!;
  const ascSign = chart.houses ? natal.signOfLon(chart.houses.asc) : null;
  const when = new Date(chart.utc);
  const dateRu = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: city.tz }).format(when);
  const timeRu = chart.timeKnown ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: city.tz }).format(when) : null;
  const offset = `UTC${chart.offsetMinutes >= 0 ? "+" : "−"}${Math.floor(Math.abs(chart.offsetMinutes) / 60)}${chart.offsetMinutes % 60 ? ":" + String(Math.abs(chart.offsetMinutes) % 60).padStart(2, "0") : ""}`;
  const aspectTexts = chart.aspects
    .map((a) => {
      const nature = natal.aspectNature(a.kind);
      const t = texts.aspects.find((x) => x.a === a.a && x.b === a.b && x.nature === nature);
      return { aspect: a, text: t?.text ?? null };
    });

  return (
    <div ref={anchor} className="mt-8 scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl">Ваша натальная карта</h2>
        <button type="button" onClick={onShare} className="btn btn-ghost !py-1.5 !px-3">{copied ? "Ссылка скопирована" : "Скопировать ссылку"}</button>
      </div>
      <p className="text-muted mt-1">
        {dateRu}{timeRu ? `, ${timeRu} (${offset})` : ", время неизвестно"} · {cityLabel(city)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="chip">Солнце · {SIGN_NAMES[sun.sign]}</span>
        <span className="chip">Луна · {SIGN_NAMES[moon.sign]}{chart.moonApprox ? " (±6°)" : ""}</span>
        {ascSign && <span className="chip">Асцендент · {SIGN_NAMES[ascSign]}</span>}
        {chart.houses && <span className="chip">{chart.houses.system === "placidus" ? "Дома Плацидуса" : "Равнодомная система"}</span>}
      </div>
      {chart.moonApprox && (
        <p className="text-sm text-muted mt-3 max-w-2xl">Время рождения не указано: расчёт сделан на полдень. Положение Луны дано с погрешностью около ±6°, а дома, Асцендент и MC не рассчитываются — для них нужно время с точностью до нескольких минут.</p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] items-start">
        <div className="card p-3">
          <NatalWheel chart={chart} className="w-full h-auto" />
          <p className="text-xs text-muted mt-2 px-1">Линии в центре — аспекты: сплошные лавандовые — трины и секстили, пунктирные — квадраты и оппозиции.</p>
        </div>
        <div className="card p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="py-1.5 pr-2 font-normal">Планета</th>
                <th className="py-1.5 pr-2 font-normal">Знак</th>
                <th className="py-1.5 pr-2 font-normal">Градус</th>
                {chart.houses && <th className="py-1.5 pr-2 font-normal">Дом</th>}
                <th className="py-1.5 font-normal">Движение</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((p) => (
                <tr key={p.body} className="border-t border-line">
                  <td className="py-1.5 pr-2"><span className="zglyph !text-base align-middle mr-1.5" aria-hidden="true">{PLANET_GLYPH[p.body]}</span>{planet(p.body)?.name}</td>
                  <td className="py-1.5 pr-2"><span className="zglyph !text-base align-middle mr-1.5" aria-hidden="true">{SIGN_GLYPHS[p.signIndex]}</span>{SIGN_NAMES[p.sign]}</td>
                  <td className="py-1.5 pr-2 whitespace-nowrap">{natal.formatDegree(p.lon)}{p.body === "moon" && chart.moonApprox ? " ±6°" : ""}</td>
                  {chart.houses && <td className="py-1.5 pr-2">{p.house}</td>}
                  <td className="py-1.5 text-muted">{p.body === "sun" || p.body === "moon" ? "—" : p.retrograde ? "ретроградное" : "директное"}</td>
                </tr>
              ))}
              {chart.houses && (
                <>
                  <tr className="border-t border-line">
                    <td className="py-1.5 pr-2">Асцендент (ASC)</td>
                    <td className="py-1.5 pr-2">{SIGN_NAMES[natal.signOfLon(chart.houses.asc)]}</td>
                    <td className="py-1.5 pr-2">{natal.formatDegree(chart.houses.asc)}</td>
                    <td className="py-1.5 pr-2">1</td>
                    <td />
                  </tr>
                  <tr className="border-t border-line">
                    <td className="py-1.5 pr-2">Середина неба (MC)</td>
                    <td className="py-1.5 pr-2">{SIGN_NAMES[natal.signOfLon(chart.houses.mc)]}</td>
                    <td className="py-1.5 pr-2">{natal.formatDegree(chart.houses.mc)}</td>
                    <td className="py-1.5 pr-2">10</td>
                    <td />
                  </tr>
                </>
              )}
            </tbody>
          </table>
          {chart.houses && (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted">Куспиды домов</summary>
              <ul className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                {chart.houses.cusps.map((c, i) => (
                  <li key={i} className="flex justify-between gap-2"><span className="text-muted">{i + 1} · {HOUSE_TITLES[i]}</span><span className="whitespace-nowrap">{SIGN_GLYPHS[Math.floor(c / 30)]} {natal.formatDegree(c)}</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      {ascSign && texts.asc[ascSign] && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Асцендент в {sign(ascSign)?.locative}</h2>
          <p className="max-w-3xl">{texts.asc[ascSign]}</p>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Планеты в знаках</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {chart.planets.map((p) => (
            <article key={p.body} className="card p-5">
              <h3 className="text-lg"><span className="zglyph !text-xl align-middle mr-2" aria-hidden="true">{PLANET_GLYPH[p.body]}</span>{planet(p.body)?.name} в {sign(p.sign)?.locative}{p.retrograde && p.body !== "sun" && p.body !== "moon" ? <span className="text-muted text-sm"> · ретроградный</span> : null}</h3>
              <p className="mt-2 text-sm">{texts.planetSign[p.body]?.[p.sign]}</p>
            </article>
          ))}
        </div>
      </section>

      {chart.houses && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Планеты в домах</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {chart.planets.map((p) => (
              <article key={p.body} className="card p-5">
                <h3 className="text-lg">{planet(p.body)?.name} в {ORDINAL[p.house! - 1]} доме <span className="text-muted text-sm">· {HOUSE_TITLES[p.house! - 1]}</span></h3>
                <p className="mt-2 text-sm">{texts.planetHouse[p.body]?.[String(p.house)]}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Аспекты</h2>
        {aspectTexts.length === 0 ? (
          <p className="text-muted">Мажорных аспектов в пределах орбисов нет.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {aspectTexts.map(({ aspect: a, text }) => (
              <article key={`${a.a}-${a.b}`} className="card p-5">
                <h3 className="text-lg">{planet(a.a)?.name} {aspectInfo(a.kind)?.withText} {planet(a.b)?.instrumental} <span className="text-muted text-sm">· орбис {a.orb.toFixed(1)}°</span></h3>
                <p className="mt-2 text-sm">{text ?? `${aspectInfo(a.kind)?.name ?? a.kind}: темы ${planet(a.a)?.name} и ${planet(a.b)?.name} связаны в вашей карте и проявляются вместе.`}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 card p-5">
        <h2 className="text-xl mb-2">Что посмотреть дальше</h2>
        <ul className="grid gap-1 text-sm">
          <li><Link className="text-accent underline" href={`/goroskop/${sun.sign}`}>Гороскоп для знака {SIGN_NAMES[sun.sign]} на сегодня</Link></li>
          <li><Link className="text-accent underline" href="/sovmestimost">Совместимость знаков зодиака</Link></li>
          <li><Link className="text-accent underline" href="/chislo-sudby">Число судьбы по той же дате рождения</Link></li>
          <li><Link className="text-accent underline" href="/lunnyy-kalendar">Лунный календарь</Link></li>
        </ul>
      </section>
    </div>
  );
}
