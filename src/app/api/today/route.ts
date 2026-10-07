import { allHoroscopes, cardOfDay, formatDateRu, horoscopeFor, shiftKey, todayKey } from "@/lib/daily";
import { getZodiac } from "@/lib/content";
import { events, mskNoon, sky } from "@/lib/astro/engine";
import { interpret } from "@/lib/astro/interpret";
import { dayInfo, PHASES } from "@/lib/moon";
import { SITE } from "@/lib/site";

/** Данные дня для автопостинга (Telegram и т. п.): карта дня, карта на завтра, Луна и настроение по знакам.
 *  Считается детерминированно от московской даты, как и сами страницы; кэш — полчаса. */
export const revalidate = 1800;

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
}

/** «Что на небе» на дату: из готового текста гороскопа (первый знак), иначе — прямо из модели интерпретации. */
function skyFacts(key: string): string[] {
  const first = getZodiac()[0];
  const h = first ? horoscopeFor(first, "segodnya", key) : null;
  if (h?.source === "astro" && h.sky.length) return h.sky;
  try {
    const noon = mskNoon(key);
    const ev = events(new Date(noon.getTime() - 86_400_000), new Date(noon.getTime() + 45 * 86_400_000));
    return interpret("oven", "segodnya", key, sky(noon), ev).sky; // факты неба одинаковы для всех знаков
  } catch {
    return [];
  }
}

export function GET() {
  const date = todayKey();
  const tomorrowKey = shiftKey(date, 1);
  const today = cardOfDay(date);
  const tomorrow = cardOfDay(tomorrowKey);
  const moon = dayInfo(date);
  const moonTomorrow = dayInfo(tomorrowKey);
  const moonJson = (m: typeof moon) => ({
    date: m.key, lunarDay: m.lunarDay, phase: m.phase, phaseName: PHASES[m.phase].name, phaseText: PHASES[m.phase].text,
    sign: m.sign.name, signSlug: m.sign.slug, illumination: m.illumination, url: `${SITE.url}/lunnyy-kalendar`,
  });
  const body = {
    date,
    dateLabel: formatDateRu(date),
    card: today && {
      name: today.card.name, slug: today.card.slug, reversed: today.reversed, arcana: today.card.arcana, suitName: today.card.suitName,
      keywords: today.card.keywords, upright: today.card.upright, reversedText: today.card.reversed,
      meaning: today.reversed ? today.card.reversed : today.card.upright, advice: today.card.advice,
      url: `${SITE.url}/karta-dnya`, cardUrl: `${SITE.url}/taro/karty/${today.card.slug}`,
    },
    tomorrowCard: tomorrow && {
      name: tomorrow.card.name, slug: tomorrow.card.slug, reversed: tomorrow.reversed,
      meaning: tomorrow.reversed ? tomorrow.card.reversed : tomorrow.card.upright, advice: tomorrow.card.advice,
      cardUrl: `${SITE.url}/taro/karty/${tomorrow.card.slug}`,
    },
    moon: moonJson(moon),
    moonTomorrow: moonJson(moonTomorrow),
    sky: skyFacts(date),
    skyTomorrow: skyFacts(tomorrowKey),
    skyUrl: `${SITE.url}/astrologiya/tranzity`,
    horoscopes: allHoroscopes("segodnya", date).map((h) => ({
      sign: h.sign.slug, name: h.sign.name, symbol: h.sign.symbol, mood: h.mood, general: firstSentence(h.general), advice: h.advice,
      url: `${SITE.url}/goroskop/${h.sign.slug}`,
    })),
  };
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=600, s-maxage=1800" } });
}
