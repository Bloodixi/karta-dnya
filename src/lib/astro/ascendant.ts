/** Калькулятор восходящего знака: разбор параметров ?d=ГГГГ-ММ-ДД&t=ЧЧ:ММ&c=<слаг города> и расчёт Асцендента
 *  тем же движком, что и натальная карта (natalChart), чтобы результаты на двух страницах совпадали до минуты дуги. */

import { readJsonData } from "@/lib/content";
import { findCityBySlug, indexCities, searchCities, type City, type IndexedCity } from "./cities";
import { formatDegree, natalChart, signOfLon } from "./natal";
import type { SignSlug } from "./types";

export const ASC_PATH = "/astrologiya/voshodyaschiy-znak";

let index: IndexedCity[] | null = null;

/** Индекс городов (читается один раз на процесс). */
export function getCityIndex(): IndexedCity[] {
  index ??= indexCities(readJsonData<City[]>("astro/cities.json", []));
  return index;
}

export type AscParams = { d?: string | string[]; t?: string | string[]; c?: string | string[] };

export type AscResult = {
  date: string;
  time: string;
  city: IndexedCity;
  utc: string;
  offsetMinutes: number;
  asc: number;            // долгота Асцендента 0..360
  sign: SignSlug;
  degree: string;         // «14°32′» внутри знака
  sunSign: SignSlug;
  moonSign: SignSlug;
  mc: number;
  mcSign: SignSlug;
};

export type AscParse =
  | { status: "empty" }
  | { status: "error"; message: string; date: string; time: string; cityQuery: string }
  | { status: "ok"; result: AscResult };

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

function validDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (y < 1800) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return false;
  return s <= new Date().toISOString().slice(0, 10);
}

/** Нормализует время «9:5» → «09:05»; null, если не время. */
function normalizeTime(s: string): string | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/** Город по слагу из ссылки или, если форма отправлена без JS, по введённому названию. */
export function resolveCity(q: string): IndexedCity | null {
  const idx = getCityIndex();
  const s = q.trim();
  if (!s) return null;
  const name = s.split(",")[0].trim(); // «Москва, Россия» из подсказки → «Москва»
  return findCityBySlug(idx, s) ?? searchCities(idx, name, 1)[0] ?? null;
}

export function parseAscParams(params: AscParams): AscParse {
  const date = one(params.d).trim();
  const timeRaw = one(params.t).trim();
  const cityQuery = one(params.c).trim();
  if (!date && !timeRaw && !cityQuery) return { status: "empty" };
  const fail = (message: string): AscParse => ({ status: "error", message, date, time: timeRaw, cityQuery });
  if (!validDate(date)) return fail("Введите настоящую дату рождения в формате ГГГГ-ММ-ДД.");
  const time = normalizeTime(timeRaw);
  if (!time) return fail("Для расчёта Асцендента нужно время рождения в формате ЧЧ:ММ — восходящий знак меняется примерно каждые два часа.");
  const city = resolveCity(cityQuery);
  if (!city) return fail("Город не найден в справочнике. Начните вводить название и выберите вариант из списка.");
  try {
    const chart = natalChart({ date, time, lat: city.lat, lon: city.lon, tz: city.tz });
    if (!chart.houses) return fail("Не удалось рассчитать Асцендент.");
    const sun = chart.planets.find((p) => p.body === "sun")!;
    const moon = chart.planets.find((p) => p.body === "moon")!;
    const asc = chart.houses.asc;
    return {
      status: "ok",
      result: {
        date, time, city,
        utc: chart.utc,
        offsetMinutes: chart.offsetMinutes,
        asc,
        sign: signOfLon(asc),
        degree: formatDegree(asc),
        sunSign: sun.sign,
        moonSign: moon.sign,
        mc: chart.houses.mc,
        mcSign: signOfLon(chart.houses.mc),
      },
    };
  } catch (e) {
    return fail(e instanceof Error ? e.message.replace(/^natal: /, "") : "Не удалось рассчитать Асцендент.");
  }
}

/** Строка запроса для ссылки на полную натальную карту с теми же данными. */
export function natalQuery(r: AscResult): string {
  return new URLSearchParams({ d: r.date, t: r.time, c: r.city.slug }).toString();
}

export function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}
