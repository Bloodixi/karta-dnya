/** Календарные выборки из астро-движка для страниц «Ретроградный Меркурий», «Луна в знаке» и «Транзиты»:
 *  периоды ретроградности, переходы Луны по знакам, события месяца. Все даты — ISO UTC, показ — по Москве. */
import { ASPECT_NAMES_RU, BODY_NAMES_RU, events, ingresses, mskDateKey, retrogradePeriods, SIGN_NAMES_RU, sky, speedOf } from "./engine";
import { getAstroData } from "./interpret";
import type { AspectKind, AstroEvent, Body, SignSlug, Sky } from "./types";

const DAY = 86_400_000;
const MSK = 3 * 3_600_000;

/* ------------------------------------------------------------------ форматирование по Москве */

const MONTHS_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];

/** «7 октября» (с годом — «7 октября 2026») по московскому времени. */
export function mskDate(iso: string | Date, withYear = false): string {
  const d = new Date(new Date(iso).getTime() + MSK);
  const s = `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`;
  return withYear ? `${s} ${d.getUTCFullYear()}` : s;
}

/** «14:32» по Москве. */
export function mskTime(iso: string | Date): string {
  const d = new Date(new Date(iso).getTime() + MSK);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

/** «7 октября, 14:32 МСК». */
export function mskDateTime(iso: string | Date, withYear = false): string {
  return `${mskDate(iso, withYear)}, ${mskTime(iso)} МСК`;
}

/** Ключ YYYY-MM-DD → ISO-строка московского полудня. */
export { mskDateKey };

/* ------------------------------------------------------------------ ретроградность */

export type RetroPeriod = {
  body: Body;
  start: string;      // ISO UTC
  end: string;        // ISO UTC
  startSign: SignSlug;
  endSign: SignSlug;
  days: number;
};

/** Периоды ретроградности тела, пересекающие календарные годы [fromYear, toYear] (с запасом по краям, чтобы поймать незавершённые). */
export function retroPeriodsByYears(body: Body, fromYear: number, toYear: number): RetroPeriod[] {
  const from = new Date(Date.UTC(fromYear - 1, 10, 1));
  const to = new Date(Date.UTC(toYear + 1, 2, 1));
  const ev = retrogradePeriods(body, from, to);
  const out: RetroPeriod[] = [];
  let open: AstroEvent | null = null;
  for (const e of ev) {
    if (e.kind === "retro-start") open = e;
    else if (e.kind === "retro-end" && open) {
      out.push({
        body, start: open.date, end: e.date, startSign: open.sign!, endSign: e.sign!,
        days: Math.round((new Date(e.date).getTime() - new Date(open.date).getTime()) / DAY),
      });
      open = null;
    }
  }
  const lo = Date.UTC(fromYear, 0, 1), hi = Date.UTC(toYear + 1, 0, 1);
  return out.filter((p) => new Date(p.end).getTime() >= lo && new Date(p.start).getTime() < hi);
}

export type RetroStatus = { retrograde: boolean; until: string | null; sign: SignSlug };

/** Состояние тела сейчас: ретроградно ли и до какого момента (следующая смена направления в ближайший год). */
export function retroStatus(body: Body, now = new Date()): RetroStatus {
  const retrograde = speedOf(body, now) < 0;
  const s = sky(now).positions.find((p) => p.body === body)!;
  const next = retrogradePeriods(body, now, new Date(now.getTime() + 400 * DAY))
    .find((e) => (retrograde ? e.kind === "retro-end" : e.kind === "retro-start"));
  return { retrograde, until: next?.date ?? null, sign: s.sign };
}

/* ------------------------------------------------------------------ Луна */

export type MoonIngress = { date: string; sign: SignSlug; fromSign: SignSlug };

/** Переходы Луны по знакам за N суток от момента. */
export function moonIngresses(from: Date, days = 31): MoonIngress[] {
  return ingresses("moon", from, new Date(from.getTime() + days * DAY)).map((e) => ({ date: e.date, sign: e.sign!, fromSign: e.fromSign! }));
}

/** Ближайший (текущий или следующий) проход Луны по знаку: вход и выход. Если Луна уже в знаке, вход — null. */
export function nextMoonInSign(sign: SignSlug, from: Date): { enter: string | null; exit: string } | null {
  const list = ingresses("moon", from, new Date(from.getTime() + 32 * DAY));
  const current = sky(from).positions.find((p) => p.body === "moon")!;
  if (current.sign === sign) {
    const exit = list[0];
    return exit ? { enter: null, exit: exit.date } : null;
  }
  const idx = list.findIndex((e) => e.sign === sign);
  if (idx < 0) return null;
  const exit = list[idx + 1];
  return { enter: list[idx].date, exit: exit ? exit.date : new Date(new Date(list[idx].date).getTime() + 2.5 * DAY).toISOString() };
}

/* ------------------------------------------------------------------ события месяца и аспекты */

export type MonthEvents = {
  planetIngresses: AstroEvent[];
  moonIngresses: AstroEvent[];
  phases: AstroEvent[];
  retro: AstroEvent[];
};

/** События на N суток вперёд, разложенные по типам. */
export function monthEvents(from: Date, days = 31): MonthEvents {
  const all = events(from, new Date(from.getTime() + days * DAY));
  return {
    planetIngresses: all.filter((e) => e.kind === "ingress" && e.body !== "moon"),
    moonIngresses: all.filter((e) => e.kind === "ingress" && e.body === "moon"),
    phases: all.filter((e) => e.kind === "new-moon" || e.kind === "full-moon" || e.kind === "first-quarter" || e.kind === "last-quarter"),
    retro: all.filter((e) => e.kind === "retro-start" || e.kind === "retro-end"),
  };
}

export const PHASE_EVENT_RU: Record<string, string> = {
  "new-moon": "Новолуние", "full-moon": "Полнолуние", "first-quarter": "Первая четверть", "last-quarter": "Последняя четверть",
};

/** Дательный падеж тел — для «в оппозиции к …». */
export const BODY_DATIVE_RU: Record<Body, string> = {
  sun: "Солнцу", moon: "Луне", mercury: "Меркурию", venus: "Венере", mars: "Марсу",
  jupiter: "Юпитеру", saturn: "Сатурну", uranus: "Урану", neptune: "Нептуну", pluto: "Плутону",
};

export type AspectRow = { a: Body; b: Body; aName: string; bName: string; kind: AspectKind; kindName: string; nature: "harmonious" | "tense" | "neutral"; natureName: string; orb: number; applying: boolean; text: string };

export const NATURE_RU = { harmonious: "гармоничный", tense: "напряжённый", neutral: "нейтральный" } as const;

/** Аспекты дня с русскими названиями и характером (из справочника aspects.json). */
export function aspectRows(s: Sky): AspectRow[] {
  const data = getAstroData();
  return s.aspects.map((x) => {
    const info = data.aspects[x.kind];
    const nature = info?.nature ?? "neutral";
    return {
      a: x.a, b: x.b, aName: BODY_NAMES_RU[x.a], bName: x.kind === "opposition" ? BODY_DATIVE_RU[x.b] : data.planets[x.b]?.instrumental ?? BODY_NAMES_RU[x.b], kind: x.kind,
      kindName: info?.name ?? ASPECT_NAMES_RU[x.kind], nature, natureName: NATURE_RU[nature],
      orb: Math.round(x.orb * 10) / 10, applying: x.applying, text: info?.text ?? "",
    };
  });
}

/** Винительный падеж знака для «переходит в …». */
export const SIGN_ACCUSATIVE: Record<SignSlug, string> = {
  oven: "Овна", telets: "Тельца", bliznetsy: "Близнецы", rak: "Рака", lev: "Льва", deva: "Деву",
  vesy: "Весы", skorpion: "Скорпиона", strelets: "Стрельца", kozerog: "Козерога", vodoley: "Водолея", ryby: "Рыбы",
};

/** Предложный падеж знака («в Овне», «во Льве»). */
export function inSignRu(sign: SignSlug): string {
  const loc = getAstroData().signs[sign]?.locative ?? SIGN_NAMES_RU[sign];
  return `${/^Ль/.test(loc) ? "во" : "в"} ${loc}`;
}

export function intoSignRu(sign: SignSlug): string {
  const acc = SIGN_ACCUSATIVE[sign];
  return `${/^Ль/.test(acc) ? "во" : "в"} ${acc}`;
}
