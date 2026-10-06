/** Отладочный CLI: `npx tsx src/lib/astro/cli.ts 2026-10-06` — позиции на 12:00 МСК, аспекты, события месяца. */

import {
  ASPECT_NAMES_RU,
  BODY_NAMES_RU,
  SIGN_NAMES_RU,
  events,
  mskNoon,
  sky,
  voidOfCourse,
} from "./engine";
import type { AstroEvent } from "./types";

const key = process.argv[2] ?? new Date(Date.now() + 3 * 3_600_000).toISOString().slice(0, 10);
const date = mskNoon(key);
const s = sky(date);

const pad = (v: string | number, n: number) => String(v).padEnd(n);
const deg = (d: number) => {
  const whole = Math.floor(d);
  const min = Math.round((d - whole) * 60);
  return `${String(whole).padStart(2, "0")}°${String(min).padStart(2, "0")}′`;
};
const msk = (iso: string) => new Date(new Date(iso).getTime() + 3 * 3_600_000).toISOString().slice(0, 16).replace("T", " ");

console.log(`Небо на ${key} 12:00 МСК (${s.date})\n`);
console.log(`${pad("Тело", 10)} ${pad("Долгота", 9)} ${pad("Знак", 10)} ${pad("Градус", 8)} ${pad("Скорость", 10)} R`);
for (const p of s.positions) {
  console.log(
    `${pad(BODY_NAMES_RU[p.body], 10)} ${pad(p.lon.toFixed(3), 9)} ${pad(SIGN_NAMES_RU[p.sign], 10)} ${pad(deg(p.degree), 8)} ${pad(p.speed.toFixed(4), 10)} ${p.retrograde ? "R" : ""}`,
  );
}

const voc = voidOfCourse(date);
console.log(
  `\nЛуна: фаза ${s.moon.phase}, освещённость ${s.moon.illumination}%, возраст ${s.moon.age} сут, ` +
    `${voc.active ? "без курса" : "с курсом"} до ${msk(voc.until.toISOString())} МСК` +
    (voc.lastAspect ? ` (последний аспект: ${ASPECT_NAMES_RU[voc.lastAspect.kind]} с ${BODY_NAMES_RU[voc.lastAspect.body]} ${msk(voc.lastAspect.date.toISOString())})` : ""),
);

console.log("\nАспекты:");
for (const a of s.aspects) {
  console.log(`  ${pad(BODY_NAMES_RU[a.a], 9)} ${pad(ASPECT_NAMES_RU[a.kind], 11)} ${pad(BODY_NAMES_RU[a.b], 9)} орб ${a.orb.toFixed(2)}° ${a.applying ? "сходящийся" : "расходящийся"}`);
}

const [y, m] = key.split("-").map(Number);
const from = new Date(Date.UTC(y, m - 1, 1));
const to = new Date(Date.UTC(y, m, 1));
const KIND_RU: Record<AstroEvent["kind"], string> = {
  ingress: "ингресс", "retro-start": "ретро старт", "retro-end": "ретро конец",
  "new-moon": "новолуние", "full-moon": "полнолуние", "first-quarter": "первая четверть", "last-quarter": "последняя четверть",
};
console.log(`\nСобытия ${key.slice(0, 7)} (время МСК):`);
for (const e of events(from, to)) {
  const where = e.kind === "ingress" ? `${SIGN_NAMES_RU[e.fromSign!]} → ${SIGN_NAMES_RU[e.sign!]}` : e.sign ? `в ${SIGN_NAMES_RU[e.sign]}` : "";
  console.log(`  ${msk(e.date)}  ${pad(BODY_NAMES_RU[e.body], 9)} ${pad(KIND_RU[e.kind], 19)} ${where}`);
}
