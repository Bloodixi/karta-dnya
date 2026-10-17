import Link from "next/link";
import type { ReactNode } from "react";
import CardBack from "@/components/CardBack";
import MoonPhase from "@/components/MoonPhase";
import RuneGlyph from "@/components/RuneGlyph";
import TarotCardView from "@/components/TarotCardView";
import ZodiacSign from "@/components/ZodiacSign";
import { compatibility } from "@/lib/compat";
import { findDreamImage, findZodiac, getDreams, getZodiac, type Zodiac } from "@/lib/content";
import { cardOfDay, hash, runeOfDay, shiftKey } from "@/lib/daily";
import { dayInfo } from "@/lib/moon";
import { destinyNumber, digitsSum, reduceSimple } from "@/lib/numerology";
import { retroStatus } from "@/lib/astro/calendar";
import { SIGN_NAMES_RU } from "@/lib/astro/engine";
import { signByDate } from "@/lib/stones";
import { TOOLS } from "@/lib/site";

/** Медальон с числом или знаком: в той же манере, что медальоны знаков и рун (градиент, латунное кольцо). */
function Medallion({ children, size = 44, tone = "air", glyph = false }: { children: ReactNode; size?: number; tone?: "air" | "gold"; glyph?: boolean }) {
  const id = `hm-${tone}`;
  const c = tone === "gold" ? { from: "#e2d6bb", to: "#7d6a45" } : { from: "#cfc3e3", to: "#5f5280" };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={id} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={c.from} />
          <stop offset="1" stopColor={c.to} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#${id})`} />
      <circle cx="50" cy="50" r="46" fill="none" stroke="#b5ab97" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#ece9f1" strokeWidth="0.6" strokeDasharray="1.5 4" opacity="0.7" />
      <text
        x="50" y={glyph ? 50 : 53} textAnchor="middle" dominantBaseline="central" fontSize={glyph ? 48 : 46} fill="#f6f3fa"
        style={{ fontFamily: glyph ? "'Segoe UI Symbol','Apple Symbols','Noto Sans Symbols',serif" : "var(--font-display)", paintOrder: "stroke", stroke: "rgba(0,0,0,.25)", strokeWidth: 1 }}
      >
        {children}
      </text>
    </svg>
  );
}

const sign = (z: Zodiac | null | undefined, size = 44) => (z ? <ZodiacSign symbol={z.symbol} element={z.element} slug={z.slug} size={size} /> : null);

/** Подпись плитки: что это (mono) и живое значение дня строкой ниже — акцентом. */
function Label({ what, value }: { what: string; value: ReactNode }) {
  return (
    <span className="flex flex-col gap-1 min-w-0">
      <span className="mono">{what}</span>
      <span className="display text-base leading-tight text-accent-text">{value}</span>
    </span>
  );
}

type Live = { label: ReactNode; visual: ReactNode; note?: string };

/** Живые мини-данные для плиток инструментов: всё детерминированно по дате МСК (как карта дня). */
function liveData(date: string): Record<string, Live> {
  const [y, m, d] = date.split("-").map(Number);
  const zodiac = getZodiac();
  const moon = dayInfo(date);
  const moonTomorrow = dayInfo(shiftKey(date, 1));
  const sun = signByDate(m, d);
  const sunZ = sun ? findZodiac(sun.slug) : null;
  const rune = runeOfDay(date);
  const dayNumber = destinyNumber(d, m, y).number;
  const yearNumber = reduceSimple(digitsSum(y));

  // Символ сна дня: только символы с иллюстрацией, чтобы плитка была с картинкой.
  const dreams = getDreams().filter((x) => findDreamImage(x.slug));
  const dream = dreams.length ? dreams[hash("dream:" + date) % dreams.length] : null;
  const dreamImg = dream ? findDreamImage(dream.slug) : null;

  // Пара дня: из удачных сочетаний (от 80%), чтобы плитка звала посмотреть, а не пугала.
  const pairs: { a: Zodiac; b: Zodiac; score: number }[] = [];
  for (let i = 0; i < zodiac.length; i++) for (let j = i + 1; j < zodiac.length; j++) {
    const c = compatibility(zodiac[i], zodiac[j]);
    if (c.score >= 80) pairs.push({ a: zodiac[i], b: zodiac[j], score: c.score });
  }
  const pair = pairs.length ? pairs[hash("pair:" + date) % pairs.length] : null;

  let mercury: { retro: boolean; sign: string } | null = null;
  try {
    const s = retroStatus("mercury");
    mercury = { retro: s.retrograde, sign: SIGN_NAMES_RU[s.sign] };
  } catch {
    mercury = null;
  }

  return {
    "/goroskop": { label: <Label what="Солнце" value={sun?.name ?? "—"} />, visual: sign(sunZ) },
    "/chislo-sudby": { label: <Label what="Число дня" value={dayNumber} />, visual: <Medallion>{dayNumber}</Medallion> },
    "/runy/runa-dnya": rune
      ? { label: <Label what="Руна" value={`${rune.rune.name}${rune.reversed ? ", перевёрнутая" : ""}`} />, visual: <RuneGlyph slug={rune.rune.slug} att={rune.rune.att} size={44} /> }
      : { label: <Label what="Руна" value="Футарк" />, visual: null },
    "/sonnik": {
      label: <Label what="Символ дня" value={dream?.word ?? "сон"} />,
      visual: dreamImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- миниатюры сонника уже 320px webp, как в каталоге
        <img src={dreamImg.thumb} width={44} height={44} alt="" loading="lazy" decoding="async" className="size-11 rounded-full object-cover border border-gold" />
      ) : null,
    },
    "/sovmestimost": pair
      ? {
          label: <Label what="Пара дня" value={`${pair.score}%`} />,
          visual: <span className="flex">{sign(pair.a, 36)}<span className="-ml-3">{sign(pair.b, 36)}</span></span>,
          note: `${pair.a.name} и ${pair.b.name}`,
        }
      : { label: <Label what="Пары" value="144" />, visual: null },
    "/goroskop/zavtra": { label: <Label what="Луна завтра" value={moonTomorrow.sign.name} />, visual: sign(findZodiac(moonTomorrow.sign.slug)) },
    "/taro/da-net": {
      label: <Label what="Ответ" value={<><span className="text-yes">да</span> · <span className="text-no">нет</span> · <span className="text-maybe">может быть</span></>} />,
      visual: <span className="block w-7"><CardBack className="w-full h-auto" /></span>,
    },
    "/taro/na-zhelanie": {
      label: <Label what="Желание" value="1 или 3 карты" />,
      visual: <span className="block w-7"><CardBack className="w-full h-auto" /></span>,
    },
    "/lunnyy-kalendar": { label: <Label what={`${moon.lunarDay}-й день`} value={`${moon.illumination}%`} />, visual: <MoonPhase age={moon.age} size={44} /> },
    "/astrologiya/natalnaya-karta": mercury
      ? { label: <Label what="Меркурий" value={mercury.retro ? "ретро" : mercury.sign} />, visual: <Medallion tone="gold" glyph>{"☿︎"}</Medallion> }
      : { label: <Label what="Планеты" value="сейчас" />, visual: <Medallion tone="gold" glyph>{"☿︎"}</Medallion> },
    "/numerologiya/po-date-rozhdeniya": { label: <Label what={`Год ${y}`} value={yearNumber} />, visual: <Medallion tone="gold">{yearNumber}</Medallion> },
  };
}

/** Плитки «Инструменты» на главной: вместо номера и рубрики — живые данные дня (карта, руна, Луна, числа). */
export default function HomeTools({ date }: { date: string }) {
  const today = cardOfDay(date);
  const live = liveData(date);
  return (
    // 11 инструментов: первая плитка («Карта дня») на две колонки — сетка 2 и 4 колонки заполняется без дыр
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {TOOLS.map((t, i) => {
        const wide = i === 0 && TOOLS.length % 2 === 1;
        if (wide) {
          return (
            <Link key={t.href} href={t.href} className="card card-hover col-span-2 p-4 sm:p-5 flex items-center gap-4">
              {today && (
                <span className="w-14 sm:w-16 shrink-0">
                  <TarotCardView slug={today.card.slug} name={today.card.name} reversed={today.reversed} className="tcard-thumb" sizes="64px" />
                </span>
              )}
              <span className="flex flex-col gap-1.5 min-w-0">
                <span className="mono">Сегодня · <span className="text-accent-text">{today ? (today.reversed ? "перевёрнутое положение" : "прямое положение") : "Таро"}</span></span>
                <span className="display text-xl sm:text-2xl">{t.title}{today ? `: ${today.card.name}` : ""}</span>
                <span className="text-sm text-muted line-clamp-2">{today ? today.card.keywords.slice(0, 3).join(" · ") : t.text}</span>
              </span>
            </Link>
          );
        }
        const l = live[t.href];
        return (
          <Link key={t.href} href={t.href} className="card card-hover p-4 sm:p-5 flex flex-col gap-3" title={t.text}>
            <span className="flex items-start justify-between gap-2">
              {l ? l.label : <span className="mono">инструмент</span>}
              {l?.visual && <span className="shrink-0 -mr-1">{l.visual}</span>}
            </span>
            <span className="mt-auto">
              <span className="display text-lg sm:text-xl block">{t.title}</span>
              {l?.note && <span className="text-xs text-muted block mt-1">{l.note}</span>}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
