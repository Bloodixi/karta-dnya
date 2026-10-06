import { allHoroscopes, cardOfDay, formatDateRu, shiftKey, todayKey } from "@/lib/daily";
import { dayInfo, PHASES } from "@/lib/moon";
import { SITE } from "@/lib/site";

/** Данные дня для автопостинга (Telegram и т. п.): карта дня, карта на завтра, Луна и настроение по знакам.
 *  Считается детерминированно от московской даты, как и сами страницы; кэш — полчаса. */
export const revalidate = 1800;

function firstSentence(text: string): string {
  const m = text.match(/^[^.!?]+[.!?]/);
  return (m ? m[0] : text).trim();
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
    horoscopes: allHoroscopes("segodnya", date).map((h) => ({
      sign: h.sign.slug, name: h.sign.name, symbol: h.sign.symbol, mood: h.mood, general: firstSentence(h.general), advice: h.advice,
      url: `${SITE.url}/goroskop/${h.sign.slug}`,
    })),
  };
  return Response.json(body, { headers: { "Cache-Control": "public, max-age=600, s-maxage=1800" } });
}
