/**
 * Модель интерпретации транзитов (гороскоп 3.0).
 * Превращает положение планет (Sky из engine.ts) в события для каждого знака:
 * планета в солярном доме и/или аспект → вес, сфера, черновая фраза из библиотеки.
 * Всё детерминировано: одинаковый вход → одинаковый выход, без случайности.
 */
import { readJsonData } from "../content";
import {
  SIGNS,
  type Aspect, type AspectKind, type AstroEvent, type Body, type Element, type HoroscopeText,
  type Interpretation, type MoonPhaseKey, type PeriodKey, type SignEvent, type SignSlug, type Sky, type Sphere,
} from "./types";

// ---------- справочники ----------

export type Tempo = "day" | "week" | "month" | "year";
export type AspectNature = "harmonious" | "tense" | "neutral";

export type PlanetInfo = { body: Body; name: string; genitive: string; instrumental: string; tempo: Tempo; themes: string[]; keywords: string[]; retroText: string; retroShort: string };
export type SignInfo = { slug: SignSlug; name: string; genitive: string; locative: string; element: Element; quality: string; ruler: Body; tone: string; moonText: string; sunText: string; ingressText: string };
export type HouseInfo = { house: number; name: string; sphere: Sphere; spheres: Sphere[]; themes: string[]; plainText: string; short: string };
export type AspectInfo = { kind: AspectKind; name: string; withText: string; nature: AspectNature; text: string };
export type Phrase = { body: Body; house: number | "any"; element: Element | "any"; sphere: Sphere; retro?: boolean; text: string };
export type AspectPhrase = { a: Body; b: Body; kind: AspectKind; text: string };
export type Texts = {
  moods: { low: string[]; mid: string[]; high: string[] };
  advice: Record<AspectNature, string[]>;
  phases: Record<MoonPhaseKey, string>;
  voidOfCourse: string;
  neutralSky: string[];
};

export type AstroData = {
  planets: Record<Body, PlanetInfo>;
  signs: Record<SignSlug, SignInfo>;
  houses: HouseInfo[]; // индекс = дом − 1
  aspects: Record<AspectKind, AspectInfo>;
  phrases: Phrase[];
  aspectPhrases: AspectPhrase[];
  texts: Texts;
};

let cache: AstroData | null = null;

/** Справочники content/data/astro/*.json (читаются один раз на процесс). */
export function getAstroData(): AstroData {
  if (cache) return cache;
  const byKey = <K extends string, T>(arr: T[], key: (t: T) => K) =>
    Object.fromEntries(arr.map((t) => [key(t), t])) as Record<K, T>;
  const planets = readJsonData<PlanetInfo[]>("astro/planets.json", []);
  const signs = readJsonData<SignInfo[]>("astro/signs.json", []);
  const houses = readJsonData<HouseInfo[]>("astro/houses.json", []).slice().sort((a, b) => a.house - b.house);
  const aspects = readJsonData<AspectInfo[]>("astro/aspects.json", []);
  cache = {
    planets: byKey(planets, (p) => p.body),
    signs: byKey(signs, (s) => s.slug),
    houses,
    aspects: byKey(aspects, (a) => a.kind),
    phrases: readJsonData<Phrase[]>("astro/phrases.json", []),
    aspectPhrases: readJsonData<AspectPhrase[]>("astro/aspectPhrases.json", []),
    texts: readJsonData<Texts>("astro/texts.json", {
      moods: { low: ["спокойное"], mid: ["ровное"], high: ["бодрое"] },
      advice: { harmonious: [], tense: [], neutral: [] },
      phases: {} as Record<MoonPhaseKey, string>,
      voidOfCourse: "",
      neutralSky: [],
    }),
  };
  return cache;
}

// ---------- базовые утилиты ----------

/** FNV-1a: тот же принцип, что в daily.ts — одинаковый вход → один результат у всех посетителей. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** Порядковый номер дня (суток от эпохи) для ключа YYYY-MM-DD — ротация фраз по дням. */
export function dayIndex(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

const MSK = 3 * 3600 * 1000;

/** ISO-момент → ключ дня по Москве. */
function mskKey(iso: string): string {
  return new Date(new Date(iso).getTime() + MSK).toISOString().slice(0, 10);
}

function dateRu(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
}

function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, Math.round(x * 1000) / 1000));
}

export function signIndexOf(sign: SignSlug): number {
  return SIGNS.indexOf(sign);
}

/** Солярный дом планеты относительно знака: знак читателя — 1-й дом, следующий — 2-й и т. д. */
export function solarHouse(planetSignIndex: number, signIndex: number): number {
  return ((planetSignIndex - signIndex + 12) % 12) + 1;
}

/** Длительность периода в днях (для отбора событий ингрессов/ретро-периодов). */
export function periodDays(period: PeriodKey, key: string): number {
  if (period === "nedelya") return 7;
  if (period === "mesyats") {
    const [y, m] = key.split("-").map(Number);
    return new Date(Date.UTC(y, m, 0)).getUTCDate();
  }
  if (period === "god") {
    const y = Number(key.slice(0, 4));
    return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
  }
  return 1;
}

function inPeriod(iso: string, period: PeriodKey, key: string): boolean {
  const k = mskKey(iso);
  const start = dayIndex(key);
  const d = dayIndex(k);
  return d >= start && d < start + periodDays(period, key);
}

// ---------- веса ----------

type BodyGroup = "moon" | "sun" | "fast" | "slow" | "outer";
type PeriodGroup = "day" | "week" | "month" | "year";

function periodGroup(period: PeriodKey): PeriodGroup {
  if (period === "nedelya") return "week";
  if (period === "mesyats") return "month";
  if (period === "god") return "year";
  return "day";
}

function bodyGroup(body: Body, planets: Record<Body, PlanetInfo>): BodyGroup {
  if (body === "moon") return "moon";
  if (body === "sun") return "sun";
  const tempo = planets[body]?.tempo ?? "week";
  return tempo === "week" ? "fast" : tempo === "month" ? "slow" : "outer";
}

/**
 * Базовый вес планеты по темпу и периоду.
 * День — главная Луна, затем быстрые планеты; неделя — Меркурий/Венера/Марс;
 * месяц — Юпитер/Сатурн (и Солнце как сезон); год — дальние планеты.
 */
export const BASE_WEIGHT: Record<PeriodGroup, Record<BodyGroup, number>> = {
  day: { moon: 1.0, fast: 0.6, sun: 0.45, slow: 0.3, outer: 0.15 },
  week: { fast: 1.0, sun: 0.6, slow: 0.5, moon: 0.35, outer: 0.2 },
  month: { slow: 1.0, sun: 0.7, fast: 0.5, outer: 0.4, moon: 0.1 },
  year: { outer: 1.0, slow: 0.8, sun: 0.3, fast: 0.2, moon: 0.05 },
};

/** Аспект планеты к Солнцу знака «по знакам»: 1-й дом — соединение, 7-й — оппозиция и т. д. */
const SOLAR_ASPECT: Record<number, AspectKind> = {
  1: "conjunction", 3: "sextile", 11: "sextile", 5: "trine", 9: "trine", 4: "square", 10: "square", 7: "opposition",
};

const SOLAR_BONUS: Record<AspectKind, number> = { conjunction: 0.2, trine: 0.15, opposition: 0.15, square: 0.12, sextile: 0.08 };

const NATURE_POLARITY: Record<AspectNature, number> = { harmonious: 1, tense: -0.8, neutral: 0.2 };

function natureOf(kind: AspectKind | undefined, data: AstroData): AspectNature | null {
  return kind ? data.aspects[kind]?.nature ?? "neutral" : null;
}

// ---------- фразы ----------

function fill(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

function houseInfo(data: AstroData, house: number): HouseInfo {
  return data.houses[house - 1] ?? { house, name: "", sphere: "general", spheres: ["general"], themes: [], plainText: "", short: "" };
}

/**
 * Детерминированный выбор фразы: кандидаты по (планета, дом, ретро) своей стихии и «любой»,
 * при нехватке — остальных стихий. Индекс = хэш(sign+period+body+house) + номер дня → соседние дни берут разные фразы,
 * пока хватает кандидатов (повтор возможен не раньше, чем через N дней при N вариантах).
 */
function pickPhrase(data: AstroData, sign: SignInfo, period: PeriodKey, key: string, body: Body, house: number, retro: boolean): { text: string; sphere: Sphere } {
  const planet = data.planets[body];
  const forHouse = data.phrases.filter((p) => p.body === body && p.house === house);
  // Пул: фразы своей стихии и «любой», при нехватке (< 7) — остальных стихий, чтобы не повторяться в соседние дни.
  const pool = (r: boolean) => {
    const base = forHouse.filter((p) => !!p.retro === r);
    const own = base.filter((p) => p.element === sign.element || p.element === "any");
    return own.length >= MIN_ROTATION ? own : own.concat(base.filter((p) => !own.includes(p)));
  };
  let cands = retro ? pool(true) : [];
  if (!cands.length) cands = pool(false);
  const h = houseInfo(data, house);
  if (!cands.length) {
    const theme = planet?.themes[0] ?? "перемены";
    return { text: `${planet?.name ?? body} ${h.plainText}: на первый план выходит тема «${theme}».`, sphere: h.sphere };
  }
  const idx = (hash(`${sign.slug}:${period}:${body}:${house}`) + dayIndex(key)) % cands.length;
  const chosen = cands[idx];
  return { text: fill(chosen.text, { sign: sign.name, planet: planet?.name ?? body, house: h.plainText }), sphere: chosen.sphere };
}

/** Сколько кандидатов нужно, чтобы фраза не повторялась в 7 соседних днях. */
const MIN_ROTATION = 7;

function aspectDraft(data: AstroData, a: Body, b: Body, kind: AspectKind): string {
  const found = data.aspectPhrases.find((p) => (p.a === a && p.b === b || p.a === b && p.b === a) && p.kind === kind);
  if (found) return found.text;
  const pa = data.planets[a], pb = data.planets[b], asp = data.aspects[kind];
  return `${pa?.name ?? a} ${asp?.withText ?? kind} ${pb?.instrumental ?? b}: ${asp?.text ?? ""}`.trim();
}

/** Строка для «Что на небе»: «Венера в трине с Юпитером: первое предложение фразы об аспекте». */
function aspectFact(data: AstroData, a: Body, b: Body, kind: AspectKind): string {
  const pa = data.planets[a], pb = data.planets[b], asp = data.aspects[kind];
  const found = data.aspectPhrases.find((p) => (p.a === a && p.b === b || p.a === b && p.b === a) && p.kind === kind);
  const body = (found ? found.text.split(/(?<=[.!?])\s/)[0].replace(/[.!?]$/, "") : asp?.text ?? "").replace(":", " —");
  return `${pa?.name ?? a} ${asp?.withText ?? kind} ${pb?.instrumental ?? b}: ${body ? body[0].toLowerCase() + body.slice(1) : ""}`.trim();
}

/** Нейтральная фраза сферы (house "any") — когда событий в сфере нет. */
function neutralPhrase(data: AstroData, sign: SignSlug, key: string, sphere: Sphere): string {
  const cands = data.phrases.filter((p) => p.house === "any" && p.sphere === sphere);
  if (!cands.length) return "";
  return cands[(hash(`${sign}:neutral:${sphere}`) + dayIndex(key)) % cands.length].text;
}

// ---------- интерпретация ----------

/**
 * Главная функция: события знака за период с весами, оценки и факты о небе.
 * @param sign знак читателя
 * @param period период (segodnya/zavtra/vchera/nedelya/mesyats/god)
 * @param key дата периода YYYY-MM-DD (periodKey из daily.ts)
 * @param sky положение планет на момент расчёта (из engine.ts)
 * @param events ингрессы, ретро-периоды и фазы Луны вокруг периода (из engine.ts), опционально
 */
export function interpret(sign: SignSlug, period: PeriodKey, key: string, sky: Sky, events: AstroEvent[] = []): Interpretation {
  const data = getAstroData();
  const info = data.signs[sign] ?? { slug: sign, name: sign, genitive: sign, locative: sign, element: "fire" as Element, quality: "", ruler: "sun" as Body, tone: "", moonText: "", sunText: "", ingressText: "" };
  const sIdx = signIndexOf(sign);
  const pg = periodGroup(period);
  const periodEvents = events.filter((e) => inPeriod(e.date, period, key));

  const baseWeight = (body: Body) => BASE_WEIGHT[pg][bodyGroup(body, data.planets)];
  const houseOf = (body: Body) => {
    const pos = sky.positions.find((p) => p.body === body);
    return pos ? solarHouse(pos.signIndex, sIdx) : 0;
  };
  const tightest = (body: Body, prefer: Body[]): Aspect | undefined => {
    const own = sky.aspects.filter((a) => a.a === body || a.b === body);
    const preferred = own.filter((a) => prefer.includes(a.a === body ? a.b : a.a));
    const list = preferred.length ? preferred : own;
    return list.slice().sort((x, y) => x.orb - y.orb)[0];
  };

  const out: SignEvent[] = [];

  // 1. Планеты в солярных домах.
  for (const pos of sky.positions) {
    const house = solarHouse(pos.signIndex, sIdx);
    let weight = baseWeight(pos.body);
    const solar = SOLAR_ASPECT[house];
    if (solar) weight += SOLAR_BONUS[solar];
    if (pos.body === info.ruler) weight += 0.1;
    const aspect = tightest(pos.body, ["sun", "moon", info.ruler]); // точный аспект усиливает событие дома; сам аспект — отдельным событием ниже
    if (aspect) weight += 0.08 * Math.max(0, 1 - aspect.orb / 8);
    if (pos.retrograde) weight *= 1.2;
    if (periodEvents.some((e) => e.body === pos.body && (e.kind === "ingress" || e.kind === "retro-start" || e.kind === "retro-end"))) weight += 0.15;
    const phrase = pickPhrase(data, info, period, key, pos.body, house, pos.retrograde);
    out.push({
      sign, period, body: pos.body, house,
      ...(pos.retrograde ? { retrograde: true } : {}),
      weight,
      sphere: phrase.sphere,
      draft: phrase.text,
    });
  }

  // 2. Аспекты Луны, Солнца и управителя знака — отдельные события с фразой об аспекте.
  const anchors = new Set<Body>(["moon", "sun", info.ruler]);
  for (const asp of sky.aspects) {
    const primary: Body | null = asp.a === "moon" || asp.b === "moon" ? "moon"
      : asp.a === "sun" || asp.b === "sun" ? "sun"
      : anchors.has(asp.a) ? asp.a : anchors.has(asp.b) ? asp.b : null;
    if (!primary) continue;
    const other = asp.a === primary ? asp.b : asp.a;
    const house = houseOf(primary);
    if (!house) continue;
    let weight = ((baseWeight(primary) + baseWeight(other)) / 2) * Math.max(0.3, 1 - asp.orb / 10) * 0.85;
    if (primary === info.ruler || other === info.ruler) weight += 0.1;
    if (asp.applying) weight += 0.03;
    out.push({
      sign, period, body: primary, house, aspect: asp,
      weight,
      sphere: houseInfo(data, house).sphere,
      draft: aspectDraft(data, primary, other, asp.kind),
    });
  }

  // Нормализация: самое сильное событие знака = 1, остальные — доля от него (порядок сохраняется).
  const max = Math.max(1, ...out.map((e) => e.weight));
  for (const e of out) e.weight = clamp01(e.weight / max);

  out.sort((x, y) => y.weight - x.weight || x.body.localeCompare(y.body) || (x.aspect ? 1 : 0) - (y.aspect ? 1 : 0));

  return {
    sign, period, key,
    events: out,
    scores: computeScores(out, sky, data),
    sky: skyFacts(sky, period, key, periodEvents, data, events),
  };
}

// ---------- оценки ----------

/**
 * Любовь/дела/энергия 1..5: сумма вес × полярность по сферам.
 * Полярность: реальный аспект — гармоничный +1, напряжённый −0.8, соединение +0.2;
 * аспект «по знакам» к Солнцу знака — мягче (±0.4); ретроградность −0.2; просто присутствие планеты +0.15.
 * Итог = round(3 + 2 × сумма), в границах 1..5.
 */
export function computeScores(events: SignEvent[], sky: Sky, data: AstroData = getAstroData()): Interpretation["scores"] {
  const raw: Record<Sphere, number> = { general: 0, love: 0, career: 0, health: 0 };
  let energy = 0;
  for (const e of events) {
    let pol = 0.15;
    const solar = natureOf(SOLAR_ASPECT[e.house], data);
    if (solar) pol += NATURE_POLARITY[solar] * 0.4;
    const real = natureOf(e.aspect?.kind, data);
    if (real) pol += NATURE_POLARITY[real] * 0.6;
    if (e.retrograde) pol -= 0.2;
    const v = e.weight * pol;
    raw[e.sphere] += v;
    // Энергия: Марс, Солнце и Луна — только знак их аспектов (без базового +0.15, чтобы не завышать).
    if (e.body === "mars" || e.body === "sun") energy += e.weight * (pol - 0.15) * 0.6;
    if (e.body === "moon") energy += e.weight * (pol - 0.15) * 0.4;
  }
  energy += raw.health;
  const phaseBoost: Partial<Record<MoonPhaseKey, number>> = {
    "waxing-crescent": 0.15, "first-quarter": 0.2, "waxing-gibbous": 0.2, full: 0.3,
    "waning-gibbous": 0.05, "last-quarter": -0.1, "waning-crescent": -0.25, new: -0.15,
  };
  energy += phaseBoost[sky.moon.phase] ?? 0;
  if (sky.moon.voidOfCourse) energy -= 0.15;
  const score = (x: number) => Math.min(5, Math.max(1, Math.round(3 + 2 * x)));
  return { love: score(raw.love), career: score(raw.career), energy: score(energy) };
}

// ---------- «Что на небе» ----------

/**
 * 3–5 фактов простыми словами: Луна и фаза, ретроградные планеты (с датой окончания, если среди allEvents есть retro-end),
 * ингрессы и лунации периода, самые точные аспекты, сезон Солнца.
 */
export function skyFacts(sky: Sky, period: PeriodKey, key: string, periodEvents: AstroEvent[], data: AstroData = getAstroData(), allEvents: AstroEvent[] = periodEvents): string[] {
  const facts: string[] = [];
  const pg = periodGroup(period);
  const P = data.planets, S = data.signs;
  const name = (b: Body) => P[b]?.name ?? b;
  const sign = (s: SignSlug | undefined) => (s ? S[s] : undefined);

  const moon = sky.positions.find((p) => p.body === "moon");
  const sun = sky.positions.find((p) => p.body === "sun");

  if (pg === "day" && moon) {
    const ms = sign(moon.sign);
    if (ms) facts.push(`Луна в ${ms.locative}: ${ms.moonText}`);
    const phase = data.texts.phases[sky.moon.phase];
    if (phase) facts.push(cap(phase));
    if (sky.moon.voidOfCourse && data.texts.voidOfCourse) facts.push(data.texts.voidOfCourse);
  }
  if (pg === "week") {
    const phase = data.texts.phases[sky.moon.phase];
    if (phase) facts.push(cap(phase));
  }

  // Ретроградные планеты (быстрые — первыми), с датой окончания, если движок её дал.
  const retro = sky.positions.filter((p) => p.retrograde && p.body !== "sun" && p.body !== "moon")
    .sort((a, b) => Math.abs(b.speed) - Math.abs(a.speed));
  const retroLimit = pg === "year" ? 3 : pg === "day" ? 1 : 2;
  for (const p of retro.slice(0, retroLimit)) {
    const end = allEvents.filter((e) => e.kind === "retro-end" && e.body === p.body && dayIndex(mskKey(e.date)) >= dayIndex(key)).sort((a, b) => a.date.localeCompare(b.date))[0];
    const until = end ? ` до ${dateRu(mskKey(end.date))}` : "";
    const tip = P[p.body]?.retroShort ?? "самое время перепроверять, а не начинать";
    facts.push(`${name(p.body)} ретрограден${p.body === "venus" ? "а" : ""}${until}: ${tip}`);
  }

  // Ингрессы и лунации внутри периода (для месяца и года — главные события).
  for (const e of periodEvents.slice().sort((a, b) => a.date.localeCompare(b.date))) {
    if (facts.length >= 5) break;
    const d = dateRu(mskKey(e.date));
    const es = sign(e.sign);
    if (e.kind === "ingress" && es && (pg !== "day" || e.body === "moon")) {
      facts.push(`${name(e.body)} переходит в ${es.name} ${d}: ${P[e.body]?.themes[0] ?? "перемены"} — ${es.ingressText}`);
    } else if (e.kind === "new-moon") {
      facts.push(`Новолуние ${d}${es ? ` в ${es.locative}` : ""}: время намерений и тихого старта`);
    } else if (e.kind === "full-moon") {
      facts.push(`Полнолуние ${d}${es ? ` в ${es.locative}` : ""}: итоги видны отчётливее, чувства ярче`);
    } else if (e.kind === "retro-start" && pg !== "day") {
      facts.push(`${name(e.body)} разворачивается в ретроградное движение ${d}: пересматривайте, а не начинайте`);
    }
  }

  // Самые точные аспекты (сначала с Луной/Солнцем — для дня, иначе любые).
  const sorted = sky.aspects.slice().sort((a, b) => a.orb - b.orb);
  const relevant = pg === "day" ? sorted : sorted.filter((a) => a.a !== "moon" && a.b !== "moon");
  for (const a of relevant.slice(0, 2)) {
    if (facts.length >= 5) break;
    facts.push(aspectFact(data, a.a, a.b, a.kind));
  }

  // Сезон Солнца и заполнение до трёх фактов.
  if (facts.length < 5 && sun && pg !== "day") {
    const ss = sign(sun.sign);
    if (ss) facts.push(`Солнце в ${ss.locative}: ${ss.sunText}`);
  }
  if (facts.length < 3 && sun) {
    const ss = sign(sun.sign);
    if (ss && !facts.some((f) => f.startsWith("Солнце в"))) facts.push(`Солнце в ${ss.locative}: ${ss.sunText}`);
  }
  let i = 0;
  while (facts.length < 3 && i < data.texts.neutralSky.length) facts.push(data.texts.neutralSky[i++]);

  return facts.slice(0, 5).map(cap);
}

// ---------- черновой текст ----------

/**
 * Черновой текст без языковой модели — запасной вариант, если ночная редактура не прошла.
 * general — 2–3 верхних события (по одному на планету), love/career/health — лучшее событие сферы
 * или нейтральная фраза, advice — по характеру главного события, mood — по оценке энергии (15 вариантов).
 */
export function draftText(i: Interpretation, generatedAt: string = new Date().toISOString()): HoroscopeText {
  const data = getAstroData();
  const seen = new Set<Body>();
  const top: SignEvent[] = [];
  for (const e of i.events) {
    if (seen.has(e.body)) continue;
    seen.add(e.body);
    top.push(e);
    if (top.length === 3) break;
  }
  const used = new Set(top.map((e) => e.draft));
  const forSphere = (s: Sphere) => {
    const fresh = i.events.find((e) => e.sphere === s && !used.has(e.draft)) ?? i.events.find((e) => e.sphere === s);
    if (fresh) {
      used.add(fresh.draft);
      return fresh.draft;
    }
    return neutralPhrase(data, i.sign, i.key, s) || "";
  };
  const love = forSphere("love");
  const career = forSphere("career");
  const health = forSphere("health");

  const lead = i.events[0];
  const nature: AspectNature = lead ? natureOf(lead.aspect?.kind, data) ?? natureOf(SOLAR_ASPECT[lead.house], data) ?? "neutral" : "neutral";
  const adviceList = data.texts.advice[nature]?.length ? data.texts.advice[nature] : data.texts.advice.neutral;
  const advice = adviceList.length ? adviceList[(hash(`${i.sign}:advice:${i.period}`) + dayIndex(i.key)) % adviceList.length] : "";

  const tier = i.scores.energy <= 2 ? "low" : i.scores.energy >= 4 ? "high" : "mid";
  const moods = data.texts.moods[tier];
  const mood = moods.length ? moods[hash(`${i.sign}:${i.key}:${i.period}:mood`) % moods.length] : "";

  return {
    sign: i.sign, period: i.period, key: i.key,
    general: top.map((e) => e.draft).join(" "),
    love, career, health, advice, mood,
    scores: i.scores,
    sky: i.sky,
    generatedAt,
    model: "draft",
  };
}
