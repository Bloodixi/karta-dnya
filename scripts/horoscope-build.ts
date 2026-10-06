/**
 * Черновики гороскопа 3.0 из астро-движка и модели интерпретации.
 *
 *   npx tsx scripts/horoscope-build.ts --date 2026-10-07 [--periods segodnya,zavtra,nedelya,mesyats,god] [--out content/data/horoscopes]
 *
 * Для каждого периода считается ключ (как periodKey в src/lib/daily.ts: день → дата, неделя → понедельник,
 * месяц → 1-е число, год → 1 января), небо на 12:00 МСК ключа, события вокруг периода (±60 дней; для года — весь год
 * плюс по два месяца с краёв: ретро-периоды и ингрессы медленных планет нужны редактору), затем interpret → draftText.
 * Результат: <out>/<период>/<ключ>.json — массив из 12 HoroscopeText (model: "draft"), по порядку SIGNS.
 * Запускать из корня сайта: справочники читаются из content/data/astro относительно process.cwd().
 */
import fs from "node:fs";
import path from "node:path";
import { events, mskNoon } from "../src/lib/astro/engine";
import { sky } from "../src/lib/astro/engine";
import { draftText, interpret, periodDays } from "../src/lib/astro/interpret";
import { SIGNS, type AstroEvent, type HoroscopeText, type PeriodKey } from "../src/lib/astro/types";

const ALL_PERIODS: PeriodKey[] = ["segodnya", "zavtra", "nedelya", "mesyats", "god"];
const DAY = 86_400_000;
const MSK = 3 * 3_600_000;

type Args = { date: string; periods: PeriodKey[]; out: string };

function usage(msg?: string): never {
  if (msg) console.error(`horoscope-build: ${msg}`);
  console.error("Использование: npx tsx scripts/horoscope-build.ts --date YYYY-MM-DD [--periods segodnya,zavtra,nedelya,mesyats,god] [--out content/data/horoscopes]");
  process.exit(2);
}

function parseArgs(argv: string[]): Args {
  const out: Args = { date: new Date(Date.now() + MSK).toISOString().slice(0, 10), periods: ALL_PERIODS, out: "content/data/horoscopes" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = argv[i + 1];
    if (a === "--date" && v) { out.date = v; i++; }
    else if (a === "--periods" && v) {
      const list = v.split(",").map((s) => s.trim()).filter(Boolean);
      for (const p of list) if (!ALL_PERIODS.includes(p as PeriodKey)) usage(`неизвестный период «${p}»`);
      out.periods = list as PeriodKey[];
      i++;
    } else if (a === "--out" && v) { out.out = v; i++; }
    else if (a === "--help" || a === "-h") usage();
    else usage(`неизвестный аргумент «${a}»`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(out.date)) usage(`дата «${out.date}» не в формате YYYY-MM-DD`);
  return out;
}

function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Ключ периода — та же логика, что periodKey в src/lib/daily.ts (дублируется, чтобы скрипт не тянул банк фраз и next). */
export function periodKeyFor(period: PeriodKey, dateKey: string): string {
  if (period === "zavtra") return shiftKey(dateKey, 1);
  if (period === "vchera") return shiftKey(dateKey, -1);
  if (period === "nedelya") {
    const [y, m, d] = dateKey.split("-").map(Number);
    const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 0 = понедельник
    return shiftKey(dateKey, -dow);
  }
  if (period === "mesyats") return dateKey.slice(0, 8) + "01";
  if (period === "god") return dateKey.slice(0, 4) + "-01-01";
  return dateKey;
}

/** Окно событий вокруг периода: ±60 дней от его границ (для года — весь год и по 60 дней с краёв). */
function eventWindow(period: PeriodKey, key: string): { from: Date; to: Date } {
  const start = mskNoon(key).getTime() - 12 * 3_600_000; // полночь МСК начала периода
  const end = start + periodDays(period, key) * DAY;
  return { from: new Date(start - 60 * DAY), to: new Date(end + 60 * DAY) };
}

/** Один файл периода: 12 текстов по порядку SIGNS. */
export function buildPeriod(period: PeriodKey, key: string, generatedAt: string): { texts: HoroscopeText[]; events: AstroEvent[] } {
  const moment = mskNoon(key);
  const s = sky(moment);
  const win = eventWindow(period, key);
  const ev = events(win.from, win.to);
  const texts = SIGNS.map((sign) => draftText(interpret(sign, period, key, s, ev), generatedAt));
  return { texts, events: ev };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const generatedAt = new Date().toISOString();
  const written: string[] = [];
  for (const period of args.periods) {
    const key = periodKeyFor(period, args.date);
    const t0 = Date.now();
    const { texts, events: ev } = buildPeriod(period, key, generatedAt);
    const dir = path.resolve(process.cwd(), args.out, period);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(texts, null, 1) + "\n", "utf8");
    // Рядом — события окна для редактора (ретро-даты, ингрессы, лунации); сайт их не читает.
    fs.writeFileSync(path.join(dir, `${key}.events.json`), JSON.stringify(ev, null, 1) + "\n", "utf8");
    written.push(path.relative(process.cwd(), file));
    console.error(`${period}/${key}: 12 текстов, ${ev.length} событий, ${Date.now() - t0} мс`);
  }
  console.log(written.join("\n"));
}

main();
