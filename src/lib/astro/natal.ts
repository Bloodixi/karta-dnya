/** Натальная карта: местное время рождения → UTC, положения планет (engine.ts), дома Плацидуса (при |φ| > 66° — равнодомная
 *  от Асцендента), ASC/MC, планеты в домах и натальные аспекты. Чистые функции, без состояния; работают и в браузере. */

import * as Astro from "astronomy-engine";
import { ASPECT_ANGLES, aspects as majorAspects, norm360, positions, signIndexOf } from "./engine";
import { SIGNS, type Aspect, type AspectKind, type Body, type Position, type SignSlug } from "./types";

const DEG = Math.PI / 180;
const MINUTE = 60_000;
/** Выше этой широты полудуги Плацидуса не определены для части эклиптики — переходим на равнодомную систему. */
export const PLACIDUS_MAX_LAT = 66;

export interface NatalInput {
  date: string;         // YYYY-MM-DD, местная дата рождения
  time: string | null;  // HH:MM местного времени; null — время неизвестно
  lat: number;          // широта места рождения, градусы (север +)
  lon: number;          // долгота, градусы (восток +)
  tz: string;           // IANA-таймзона места рождения
}

export type HouseSystem = "placidus" | "equal";

export interface NatalPlanet extends Position {
  house: number | null; // 1..12; null — время рождения неизвестно
}

export interface NatalChart {
  input: NatalInput;
  utc: string;              // ISO-момент расчёта
  offsetMinutes: number;    // смещение местного времени от UTC на момент рождения
  timeKnown: boolean;
  moonApprox: boolean;      // время неизвестно: Луна взята на местный полдень, погрешность ±6–7°
  planets: NatalPlanet[];
  aspects: Aspect[];
  houses: { system: HouseSystem; cusps: number[]; asc: number; mc: number } | null; // cusps[0] = 1-й дом (ASC)
}

/* ------------------------------------------------------------------ время */

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function formatter(tz: string): Intl.DateTimeFormat {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
    });
    dtfCache.set(tz, f);
  }
  return f;
}

/** Смещение таймзоны от UTC в минутах на момент `at` (положительное — восточнее Гринвича). Исторические правила — из базы tz
 *  окружения (ICU); для дат до 1970 года летнее/декретное время может быть учтено неточно. */
export function tzOffsetMinutes(tz: string, at: Date): number {
  const parts = formatter(tz).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return Math.round((asUtc - at.getTime()) / MINUTE);
}

/** Проверка, что таймзона известна окружению. */
export function isValidTimeZone(tz: string): boolean {
  try {
    formatter(tz);
    return true;
  } catch {
    return false;
  }
}

/** Местные дата и время в таймзоне → момент UTC. Две итерации по смещению покрывают переходы на летнее время. */
export function localToUtc(date: string, time: string, tz: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m) throw new Error(`natal: неверная дата «${date}», ожидается YYYY-MM-DD`);
  if (!t) throw new Error(`natal: неверное время «${time}», ожидается HH:MM`);
  const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2]));
  let guess = wall - tzOffsetMinutes(tz, new Date(wall)) * MINUTE;
  guess = wall - tzOffsetMinutes(tz, new Date(guess)) * MINUTE;
  return new Date(guess);
}

/* ------------------------------------------------------------------ сферическая геометрия */

/** Истинный наклон эклиптики к экватору, градусы. */
export function obliquity(date: Date): number {
  return Astro.e_tilt(Astro.MakeTime(date)).tobl;
}

/** Прямое восхождение меридиана (RAMC): гринвичское видимое звёздное время + долгота, градусы 0..360. */
export function ramc(date: Date, lon: number): number {
  return norm360(Astro.SiderealTime(date) * 15 + lon);
}

/** Эклиптическая долгота точки эклиптики с прямым восхождением ra (градусы). */
function eclipticLonFromRa(ra: number, eps: number): number {
  return norm360(Math.atan2(Math.sin(ra * DEG), Math.cos(ra * DEG) * Math.cos(eps * DEG)) / DEG);
}

/** Долгота MC по RAMC. */
export function midheaven(ramcDeg: number, eps: number): number {
  return eclipticLonFromRa(ramcDeg, eps);
}

/** Долгота Асцендента по RAMC, широте и наклону эклиптики. */
export function ascendant(ramcDeg: number, lat: number, eps: number): number {
  const r = ramcDeg * DEG;
  const e = eps * DEG;
  const y = Math.cos(r);
  const x = -(Math.sin(r) * Math.cos(e) + Math.tan(lat * DEG) * Math.sin(e));
  return norm360(Math.atan2(y, x) / DEG);
}

/** Склонение точки эклиптики с прямым восхождением ra. */
function declinationOnEcliptic(ra: number, eps: number): number {
  return Math.asin(Math.sin(eps * DEG) * Math.sin(ra * DEG)) / DEG;
}

/**
 * Промежуточный куспид Плацидуса итерацией по полудугам. `fraction` — доля полудуги (1/3 или 2/3),
 * `diurnal` — дневная полудуга (дома 11, 12) или ночная (дома 2, 3). Возвращает прямое восхождение куспида.
 */
function placidusRa(ramcDeg: number, lat: number, eps: number, fraction: number, diurnal: boolean, start: number): number {
  const tanLat = Math.tan(lat * DEG);
  let ra = ramcDeg + start;
  for (let i = 0; i < 50; i++) {
    const dec = declinationOnEcliptic(ra, eps);
    const cosArc = -Math.tan(dec * DEG) * tanLat; // cos дневной полудуги
    const clamped = Math.max(-1, Math.min(1, cosArc));
    const dsa = Math.acos(clamped) / DEG;         // дневная полудуга, градусы
    const next = diurnal ? ramcDeg + dsa * fraction : ramcDeg + 180 - (180 - dsa) * fraction;
    if (Math.abs(next - ra) < 1e-7) return norm360(next);
    ra = next;
  }
  return norm360(ra);
}

/** Куспиды Плацидуса: массив из 12 долгот, индекс 0 — 1-й дом (ASC), 9 — 10-й (MC). */
export function placidusCusps(ramcDeg: number, lat: number, eps: number): number[] {
  const asc = ascendant(ramcDeg, lat, eps);
  const mc = midheaven(ramcDeg, eps);
  const c11 = eclipticLonFromRa(placidusRa(ramcDeg, lat, eps, 1 / 3, true, 30), eps);
  const c12 = eclipticLonFromRa(placidusRa(ramcDeg, lat, eps, 2 / 3, true, 60), eps);
  const c2 = eclipticLonFromRa(placidusRa(ramcDeg, lat, eps, 2 / 3, false, 120), eps);
  const c3 = eclipticLonFromRa(placidusRa(ramcDeg, lat, eps, 1 / 3, false, 150), eps);
  const cusps = [asc, c2, c3, norm360(mc + 180), norm360(c11 + 180), norm360(c12 + 180), norm360(asc + 180), norm360(c2 + 180), norm360(c3 + 180), mc, c11, c12];
  return cusps;
}

/** Равнодомные куспиды от Асцендента (по 30°). */
export function equalCusps(asc: number): number[] {
  return Array.from({ length: 12 }, (_, i) => norm360(asc + 30 * i));
}

/** Номер дома (1..12) для долготы по массиву куспидов. */
export function houseOf(lon: number, cusps: number[]): number {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i];
    const b = cusps[(i + 1) % 12];
    const span = norm360(b - a);
    const d = norm360(lon - a);
    if (d < span) return i + 1;
  }
  return 12;
}

/* ------------------------------------------------------------------ карта */

/** Расчёт натальной карты. При неизвестном времени берётся местный полдень; дома и ASC/MC не считаются. */
export function natalChart(input: NatalInput): NatalChart {
  if (!Number.isFinite(input.lat) || Math.abs(input.lat) > 90) throw new Error("natal: широта вне диапазона");
  if (!Number.isFinite(input.lon) || Math.abs(input.lon) > 180) throw new Error("natal: долгота вне диапазона");
  const timeKnown = input.time !== null && input.time !== "";
  const utc = localToUtc(input.date, timeKnown ? (input.time as string) : "12:00", input.tz);
  const offsetMinutes = tzOffsetMinutes(input.tz, utc);
  const pos = positions(utc);
  const asp = majorAspects(pos);

  let houses: NatalChart["houses"] = null;
  if (timeKnown) {
    const eps = obliquity(utc);
    const r = ramc(utc, input.lon);
    const asc = ascendant(r, input.lat, eps);
    const mc = midheaven(r, eps);
    const usePlacidus = Math.abs(input.lat) <= PLACIDUS_MAX_LAT;
    const cusps = usePlacidus ? placidusCusps(r, input.lat, eps) : equalCusps(asc);
    houses = { system: usePlacidus ? "placidus" : "equal", cusps, asc, mc };
  }

  const planets: NatalPlanet[] = pos.map((p) => ({ ...p, house: houses ? houseOf(p.lon, houses.cusps) : null }));
  return { input, utc: utc.toISOString(), offsetMinutes, timeKnown, moonApprox: !timeKnown, planets, aspects: asp, houses };
}

/* ------------------------------------------------------------------ вспомогательное для вывода */

/** Характер аспекта для подбора трактовки. */
export type AspectNature = "conjunction" | "harmonious" | "tense";

export function aspectNature(kind: AspectKind): AspectNature {
  if (kind === "conjunction") return "conjunction";
  return kind === "sextile" || kind === "trine" ? "harmonious" : "tense";
}

/** Градусы и минуты внутри знака: 14°32′. */
export function formatDegree(lon: number): string {
  const inSign = norm360(lon) - signIndexOf(lon) * 30;
  let deg = Math.floor(inSign);
  let min = Math.round((inSign - deg) * 60);
  if (min === 60) { deg += 1; min = 0; }
  if (deg === 30) { deg = 29; min = 59; } // не выходим за границу знака при округлении
  return `${deg}°${String(min).padStart(2, "0")}′`;
}

export function signOfLon(lon: number): SignSlug {
  return SIGNS[signIndexOf(lon)];
}

export { ASPECT_ANGLES };
export type { Aspect, Body };
