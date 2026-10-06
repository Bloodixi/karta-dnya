/** Контракт между астро-движком (engine.ts) и моделью интерпретации (interpret.ts). Менять только согласованно. */

export type Body = "sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto";
export const BODIES: Body[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

export type SignSlug = "oven" | "telets" | "bliznetsy" | "rak" | "lev" | "deva" | "vesy" | "skorpion" | "strelets" | "kozerog" | "vodoley" | "ryby";
export const SIGNS: SignSlug[] = ["oven", "telets", "bliznetsy", "rak", "lev", "deva", "vesy", "skorpion", "strelets", "kozerog", "vodoley", "ryby"];

export type Element = "fire" | "earth" | "air" | "water";

/** Положение тела в геоцентрической эклиптике на момент времени. */
export interface Position {
  body: Body;
  lon: number;          // эклиптическая долгота 0..360
  sign: SignSlug;
  signIndex: number;    // 0 = Овен
  degree: number;       // градус внутри знака 0..30
  speed: number;        // град/сутки, отрицательная = ретроградное движение
  retrograde: boolean;
}

export type AspectKind = "conjunction" | "sextile" | "square" | "trine" | "opposition";

export interface Aspect {
  a: Body;
  b: Body;
  kind: AspectKind;
  orb: number;          // текущее отклонение от точного аспекта, градусы
  applying: boolean;    // сходящийся (орб уменьшается)
}

export type MoonPhaseKey = "new" | "waxing-crescent" | "first-quarter" | "waxing-gibbous" | "full" | "waning-gibbous" | "last-quarter" | "waning-crescent";

export interface Sky {
  date: string;         // ISO UTC момента расчёта
  positions: Position[];
  aspects: Aspect[];
  moon: { phase: MoonPhaseKey; illumination: number; age: number; voidOfCourse: boolean };
}

export type EventKind = "ingress" | "retro-start" | "retro-end" | "new-moon" | "full-moon" | "first-quarter" | "last-quarter";

export interface AstroEvent {
  kind: EventKind;
  body: Body;
  date: string;         // ISO UTC
  sign?: SignSlug;      // для ingress — новый знак; для фаз Луны — знак Луны
  fromSign?: SignSlug;
}

export type PeriodKey = "segodnya" | "zavtra" | "vchera" | "nedelya" | "mesyats" | "god";
export type Sphere = "general" | "love" | "career" | "health";

/** Событие для конкретного знака: планета в солярном доме и/или аспект, с весом и черновой фразой. */
export interface SignEvent {
  sign: SignSlug;
  period: PeriodKey;
  body: Body;
  house: number;        // солярный дом 1..12 относительно знака
  aspect?: Aspect;
  retrograde?: boolean;
  weight: number;       // 0..1, вклад в прогноз
  sphere: Sphere;
  draft: string;        // черновая фраза из библиотеки
}

export interface Interpretation {
  sign: SignSlug;
  period: PeriodKey;
  key: string;          // дата периода YYYY-MM-DD (как periodKey в daily.ts)
  events: SignEvent[];  // по убыванию веса
  scores: { love: number; career: number; energy: number }; // 1..5
  sky: string[];        // «Что на небе»: 3–5 фактов простыми словами
}

/** Готовый текст после редактуры (content/data/horoscopes/<key>.json → по знаку и периоду). */
export interface HoroscopeText {
  sign: SignSlug;
  period: PeriodKey;
  key: string;
  general: string;
  love: string;
  career: string;
  health: string;
  advice: string;
  mood: string;
  scores: { love: number; career: number; energy: number };
  sky: string[];
  generatedAt: string;
  model?: string;
}
