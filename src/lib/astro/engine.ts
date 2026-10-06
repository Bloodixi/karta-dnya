/** Астро-движок гороскопа 3.0: геоцентрические эклиптические долготы, аспекты, фазы Луны, ингрессы и ретроградность.
 *  Эфемериды — astronomy-engine (MIT, чистый JS): планеты по усечённому VSOP87 (точность ~1′), Луна по теории Брауна
 *  (Montenbruck–Pfleger, ~1′). Долготы берутся в истинной эклиптике даты с учётом аберрации и светового времени —
 *  так же, как в астрологических программах. Все функции чистые и детерминированные; кэш — модульная Map по ISO-дате. */

import * as Astro from "astronomy-engine";
import {
  BODIES,
  SIGNS,
  type Aspect,
  type AspectKind,
  type AstroEvent,
  type Body,
  type MoonPhaseKey,
  type Position,
  type SignSlug,
  type Sky,
} from "./types";

/* ------------------------------------------------------------------ константы */

const HOUR = 3_600_000;
const MINUTE = 60_000;
const DAY = 86_400_000;
/** Средний синодический месяц, сутки. */
export const SYNODIC_MONTH = 29.530588853;

export const SIGN_NAMES_RU: Record<SignSlug, string> = {
  oven: "Овен", telets: "Телец", bliznetsy: "Близнецы", rak: "Рак", lev: "Лев", deva: "Дева",
  vesy: "Весы", skorpion: "Скорпион", strelets: "Стрелец", kozerog: "Козерог", vodoley: "Водолей", ryby: "Рыбы",
};

export const BODY_NAMES_RU: Record<Body, string> = {
  sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс",
  jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон",
};

export const ASPECT_ANGLES: Record<AspectKind, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
};

export const ASPECT_NAMES_RU: Record<AspectKind, string> = {
  conjunction: "соединение", sextile: "секстиль", square: "квадрат", trine: "трин", opposition: "оппозиция",
};

/** Орбис по телу, градусы. Для пары берётся больший из двух. */
export const ORBS: Record<Body, number> = {
  sun: 8, moon: 8, mercury: 6, venus: 6, mars: 6, jupiter: 5, saturn: 5, uranus: 5, neptune: 5, pluto: 5,
};

const ASTRO_BODY: Record<Body, Astro.Body> = {
  sun: Astro.Body.Sun, moon: Astro.Body.Moon, mercury: Astro.Body.Mercury, venus: Astro.Body.Venus, mars: Astro.Body.Mars,
  jupiter: Astro.Body.Jupiter, saturn: Astro.Body.Saturn, uranus: Astro.Body.Uranus, neptune: Astro.Body.Neptune, pluto: Astro.Body.Pluto,
};

/** Тела, у которых бывает ретроградное движение (Солнце и Луна — никогда). */
const RETRO_BODIES: Body[] = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

/* ------------------------------------------------------------------ утилиты углов */

/** Нормализует угол в диапазон [0, 360). */
export function norm360(deg: number): number {
  const x = deg % 360;
  return x < 0 ? x + 360 : x;
}

/** Разность углов a − b в диапазоне (−180, 180]. */
export function signedDiff(a: number, b: number): number {
  const d = norm360(a - b);
  return d > 180 ? d - 360 : d;
}

/** Угловое расстояние между двумя долготами, 0..180. */
export function separation(a: number, b: number): number {
  return Math.abs(signedDiff(a, b));
}

/** Индекс знака (0 = Овен) по долготе. */
export function signIndexOf(lon: number): number {
  return Math.floor(norm360(lon) / 30) % 12;
}

/** Слаг знака по долготе. */
export function signOf(lon: number): SignSlug {
  return SIGNS[signIndexOf(lon)];
}

/* ------------------------------------------------------------------ эфемериды */

/** Геоцентрическая эклиптическая долгота тела (истинная эклиптика даты), градусы 0..360. */
export function longitude(body: Body, date: Date): number {
  if (body === "moon") return norm360(Astro.EclipticGeoMoon(date).lon);
  return norm360(Astro.Ecliptic(Astro.GeoVector(ASTRO_BODY[body], date, true)).elon);
}

/** Скорость по долготе, град/сутки: центральная разность за ±1 час. */
export function speedOf(body: Body, date: Date): number {
  const before = longitude(body, new Date(date.getTime() - HOUR));
  const after = longitude(body, new Date(date.getTime() + HOUR));
  return signedDiff(after, before) * 12; // (Δ за 2 часа) × 12 = град/сутки
}

function positionOf(body: Body, date: Date): Position {
  const lon = longitude(body, date);
  const speed = speedOf(body, date);
  const signIndex = signIndexOf(lon);
  return {
    body,
    lon,
    sign: SIGNS[signIndex],
    signIndex,
    degree: lon - signIndex * 30,
    speed,
    retrograde: speed < 0,
  };
}

/* ------------------------------------------------------------------ кэш */

const CACHE_LIMIT = 4096;
const positionsCache = new Map<string, Position[]>();
const skyCache = new Map<string, Sky>();

function remember<T>(cache: Map<string, T>, key: string, compute: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit;
  const value = compute();
  if (cache.size >= CACHE_LIMIT) cache.clear();
  cache.set(key, value);
  return value;
}

/** Очистка кэшей (для тестов). */
export function clearAstroCache(): void {
  positionsCache.clear();
  skyCache.clear();
}

/* ------------------------------------------------------------------ публичный API */

/** Позиции Солнца, Луны и восьми планет на момент времени. Порядок — как в BODIES. */
export function positions(date: Date): Position[] {
  return remember(positionsCache, date.toISOString(), () => BODIES.map((b) => positionOf(b, date)));
}

/** Мажорные аспекты между всеми парами тел. applying — орб уменьшается (аспект сходящийся). */
export function aspects(pos: Position[]): Aspect[] {
  const out: Aspect[] = [];
  const kinds = Object.keys(ASPECT_ANGLES) as AspectKind[];
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const a = pos[i];
      const b = pos[j];
      const maxOrb = Math.max(ORBS[a.body], ORBS[b.body]);
      const sepNow = separation(a.lon, b.lon);
      // Положение через малый шаг времени — по текущим скоростям (линейно), чтобы понять, сходится ли аспект.
      const dt = 0.01; // сутки
      const sepNext = separation(a.lon + a.speed * dt, b.lon + b.speed * dt);
      for (const kind of kinds) {
        const angle = ASPECT_ANGLES[kind];
        const orb = Math.abs(sepNow - angle);
        if (orb > maxOrb) continue;
        const orbNext = Math.abs(sepNext - angle);
        out.push({ a: a.body, b: b.body, kind, orb, applying: orbNext < orb });
        break; // одна пара — не больше одного мажорного аспекта
      }
    }
  }
  return out.sort((x, y) => x.orb - y.orb);
}

/** Фаза Луны по углу элонгации от Солнца (0 = новолуние, 180 = полнолуние).
 *  Кардинальные фазы — окно ±12° (≈ ±1 сутки) вокруг точного момента. */
export function moonPhaseKey(elongation: number): MoonPhaseKey {
  const e = norm360(elongation);
  const W = 12;
  if (e < W || e >= 360 - W) return "new";
  if (e < 90 - W) return "waxing-crescent";
  if (e < 90 + W) return "first-quarter";
  if (e < 180 - W) return "waxing-gibbous";
  if (e < 180 + W) return "full";
  if (e < 270 - W) return "waning-gibbous";
  if (e < 270 + W) return "last-quarter";
  return "waning-crescent";
}

/** Момент последнего новолуния до даты (включительно). */
export function previousNewMoon(date: Date): Date {
  let candidate = Astro.SearchMoonPhase(0, new Date(date.getTime() - 31 * DAY), 33);
  if (!candidate) throw new Error("astro: новолуние не найдено");
  for (;;) {
    const next = Astro.SearchMoonPhase(0, new Date(candidate.date.getTime() + DAY), 33);
    if (!next || next.date.getTime() > date.getTime()) break;
    candidate = next;
  }
  return candidate.date;
}

/** Возраст Луны в сутках от последнего новолуния. */
export function moonAge(date: Date): number {
  return (date.getTime() - previousNewMoon(date).getTime()) / DAY;
}

/** Освещённость диска Луны, проценты 0..100 (одна десятая). */
export function moonIllumination(date: Date): number {
  return Math.round(Astro.Illumination(Astro.Body.Moon, date).phase_fraction * 1000) / 10;
}

/** Знак Луны на момент времени. */
export function moonSign(date: Date): SignSlug {
  return signOf(longitude("moon", date));
}

/** Момент выхода Луны из текущего знака (шаг 10 минут, затем бисекция до минуты). */
export function moonSignExit(date: Date): Date {
  const startSign = signIndexOf(longitude("moon", date));
  let t = date.getTime();
  const step = 10 * MINUTE;
  for (let i = 0; i < 3 * 24 * 6 + 6; i++) {
    const next = t + step;
    if (signIndexOf(longitude("moon", new Date(next))) !== startSign) {
      return bisectSignChange("moon", new Date(t), new Date(next), startSign);
    }
    t = next;
  }
  throw new Error("astro: Луна не сменила знак за 3 суток");
}

/** Луна без курса (упрощённо): до выхода из знака Луна не образует ни одного точного мажорного аспекта
 *  к Солнцу и планетам. Возвращает признак, момент выхода из знака и последний точный аспект (если есть).
 *  Шаг проверки — 10 минут; Луна всегда быстрее остальных тел, поэтому знаковая разность долгот растёт монотонно. */
export function voidOfCourse(date: Date): { active: boolean; until: Date; lastAspect?: { body: Body; kind: AspectKind; date: Date } } {
  const until = moonSignExit(date);
  const others = BODIES.filter((b) => b !== "moon");
  const step = 10 * MINUTE;
  // Цели по знаковой разности Луна − планета: 0, ±60, ±90, ±120; оппозиция — переход через ±180 (разрыв).
  const targets: { kind: AspectKind; value: number }[] = [
    { kind: "conjunction", value: 0 },
    { kind: "sextile", value: 60 }, { kind: "sextile", value: -60 },
    { kind: "square", value: 90 }, { kind: "square", value: -90 },
    { kind: "trine", value: 120 }, { kind: "trine", value: -120 },
  ];

  const diffs = (t: number): number[] => {
    const moonLon = longitude("moon", new Date(t));
    return others.map((b) => signedDiff(moonLon, longitude(b, new Date(t))));
  };

  let lastAspect: { body: Body; kind: AspectKind; date: Date } | undefined;
  let prev = diffs(date.getTime());
  for (let t = date.getTime() + step; ; t += step) {
    const tt = Math.min(t, until.getTime());
    const cur = diffs(tt);
    for (let i = 0; i < others.length; i++) {
      const a = prev[i];
      const b = cur[i];
      if (b < a - 90) {
        // разрыв +180 → −180: Луна прошла точную оппозицию
        lastAspect = { body: others[i], kind: "opposition", date: new Date(tt) };
        continue;
      }
      for (const { kind, value } of targets) {
        if (a - value <= 0 && b - value > 0) lastAspect = { body: others[i], kind, date: new Date(tt) };
      }
    }
    prev = cur;
    if (tt >= until.getTime()) break;
  }
  return { active: !lastAspect, until, lastAspect };
}

/** Полная картина неба на момент времени. */
export function sky(date: Date): Sky {
  return remember(skyCache, date.toISOString(), () => {
    const pos = positions(date);
    const elongation = Astro.MoonPhase(date);
    return {
      date: date.toISOString(),
      positions: pos,
      aspects: aspects(pos),
      moon: {
        phase: moonPhaseKey(elongation),
        illumination: moonIllumination(date),
        age: Math.round(moonAge(date) * 100) / 100,
        voidOfCourse: voidOfCourse(date).active,
      },
    };
  });
}

/* ------------------------------------------------------------------ события */

/** Бисекция момента смены знака между lo (старый знак) и hi (новый) с точностью до минуты. */
function bisectSignChange(body: Body, lo: Date, hi: Date, fromIndex: number): Date {
  let a = lo.getTime();
  let b = hi.getTime();
  while (b - a > MINUTE) {
    const mid = Math.floor((a + b) / 2);
    if (signIndexOf(longitude(body, new Date(mid))) === fromIndex) a = mid;
    else b = mid;
  }
  return new Date(b);
}

/** Бисекция момента смены знака скорости (стационарность) с точностью до минуты. */
function bisectSpeedChange(body: Body, lo: Date, hi: Date, loNegative: boolean): Date {
  let a = lo.getTime();
  let b = hi.getTime();
  while (b - a > MINUTE) {
    const mid = Math.floor((a + b) / 2);
    if (speedOf(body, new Date(mid)) < 0 === loNegative) a = mid;
    else b = mid;
  }
  return new Date(b);
}

/** Ингрессы тела за период: шаг 1 час, уточнение бисекцией до минуты. */
export function ingresses(body: Body, from: Date, to: Date): AstroEvent[] {
  const out: AstroEvent[] = [];
  let t = from.getTime();
  let prevIndex = signIndexOf(longitude(body, from));
  while (t < to.getTime()) {
    const next = Math.min(t + HOUR, to.getTime());
    const idx = signIndexOf(longitude(body, new Date(next)));
    if (idx !== prevIndex) {
      const when = bisectSignChange(body, new Date(t), new Date(next), prevIndex);
      out.push({ kind: "ingress", body, date: when.toISOString(), sign: SIGNS[idx], fromSign: SIGNS[prevIndex] });
      prevIndex = idx;
    }
    t = next;
  }
  return out;
}

/** Старты и концы ретроградности тела за период: шаг 6 часов по знаку скорости, уточнение до минуты. */
export function retrogradePeriods(body: Body, from: Date, to: Date): AstroEvent[] {
  if (!RETRO_BODIES.includes(body)) return [];
  const out: AstroEvent[] = [];
  const step = 6 * HOUR;
  let t = from.getTime();
  let prevNeg = speedOf(body, from) < 0;
  while (t < to.getTime()) {
    const next = Math.min(t + step, to.getTime());
    const neg = speedOf(body, new Date(next)) < 0;
    if (neg !== prevNeg) {
      const when = bisectSpeedChange(body, new Date(t), new Date(next), prevNeg);
      out.push({ kind: neg ? "retro-start" : "retro-end", body, date: when.toISOString(), sign: signOf(longitude(body, when)) });
      prevNeg = neg;
    }
    t = next;
  }
  return out;
}

const QUARTER_KINDS = ["new-moon", "first-quarter", "full-moon", "last-quarter"] as const;

/** Новолуния, полнолуния и четверти за период (astronomy-engine SearchMoonQuarter). */
export function moonQuarters(from: Date, to: Date): AstroEvent[] {
  const out: AstroEvent[] = [];
  let q = Astro.SearchMoonQuarter(from);
  while (q.time.date.getTime() <= to.getTime()) {
    const when = q.time.date;
    out.push({ kind: QUARTER_KINDS[q.quarter], body: "moon", date: when.toISOString(), sign: moonSign(when) });
    q = Astro.NextMoonQuarter(q);
  }
  return out;
}

/** Все события за период, отсортированные по дате: ингрессы, ретроградность, фазы Луны. */
export function events(from: Date, to: Date): AstroEvent[] {
  if (to.getTime() <= from.getTime()) return [];
  const out: AstroEvent[] = [];
  for (const body of BODIES) {
    out.push(...ingresses(body, from, to));
    out.push(...retrogradePeriods(body, from, to));
  }
  out.push(...moonQuarters(from, to));
  return out.sort((a, b) => a.date.localeCompare(b.date) || BODIES.indexOf(a.body) - BODIES.indexOf(b.body));
}

/* ------------------------------------------------------------------ солярные дома и время */

/** Солярные дома: дом = ((знак планеты − знак) mod 12) + 1. */
export function solarHouses(sign: SignSlug, pos: Position[]): { body: Body; house: number }[] {
  const base = SIGNS.indexOf(sign);
  return pos.map((p) => ({ body: p.body, house: ((p.signIndex - base + 12) % 12) + 1 }));
}

/** 12:00 по Москве (UTC+3) для ключа YYYY-MM-DD — момент, на который считаются гороскопы. */
export function mskNoon(dateKey: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) throw new Error(`astro: неверный ключ даты «${dateKey}», ожидается YYYY-MM-DD`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9, 0, 0, 0));
}

/** Ключ YYYY-MM-DD по московской дате момента. */
export function mskDateKey(date: Date): string {
  return new Date(date.getTime() + 3 * HOUR).toISOString().slice(0, 10);
}
