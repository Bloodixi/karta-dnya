/**
 * Новогодний подарок: когда показывать блок «Подари прогноз на <год> год» (с 1 ноября по 7 января по Москве),
 * готовые дни отправки письма (31 декабря и 1 января) и ссылки «Подарить» в письмах и на странице разбора.
 * Без серверных зависимостей — используется и в форме оплаты в браузере.
 */

const MSK = 3 * 3_600_000; // Москва — UTC+3 круглый год

/** Сегодня по Москве, ГГГГ-ММ-ДД. */
export const todayMskIso = (now = Date.now()) => new Date(now + MSK).toISOString().slice(0, 10);

/** Идёт ли новогодний сезон подарков: с 1 ноября по 7 января (дата по Москве). */
export function nySeason(today = todayMskIso()): boolean {
  const md = today.slice(5);
  return md >= "11-01" || md <= "01-07";
}

/** Год, на который дарят прогноз: во втором полугодии — следующий (и для проверки ?ny=1 в октябре), в январе — текущий. */
export function nyYear(today = todayMskIso()): number {
  const y = Number(today.slice(0, 4));
  return Number(today.slice(5, 7)) >= 7 ? y + 1 : y;
}

/** Готовые дни отправки: 31 декабря и 1 января — только те, что ещё впереди (сегодня — это «сразу»). */
export function nyDates(today = todayMskIso()): { iso: string; label: string }[] {
  const y = nyYear(today);
  return [
    { iso: `${y - 1}-12-31`, label: "31 декабря" },
    { iso: `${y}-01-01`, label: "1 января" },
  ].filter((d) => d.iso > today);
}

/**
 * С какого месяца считать прогноз отложенного подарка: месяц отправки, а письмо в последнюю неделю декабря
 * (с 25-го) — уже подарок к Новому году: прогноз с января следующего года.
 */
export function giftStartYm(sendAt: string): { yr: number; mo: number } | null {
  const m = sendAt.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const yr = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  return mo === 12 && d >= 25 ? { yr: yr + 1, mo: 1 } : { yr, mo };
}

/** Якорь новогоднего блока на /razbor. */
export const NY_ANCHOR = "novyy-god";

/** «Подарить» со страницы результата: в новогодний сезон — к новогоднему блоку, иначе — к форме подарка. */
export function giftPath(today = todayMskIso()): string {
  return nySeason(today) ? `/razbor?g=1&ny=1#${NY_ANCHOR}` : "/razbor?g=1#forma";
}

/** «Подарить» из писем (абсолютный адрес с utm): в новогодний сезон — utm_campaign=ny и новогодний блок. */
export function giftMailUrl(site: string, medium: string, today = todayMskIso()): string {
  const ny = nySeason(today);
  return `${site}/razbor?g=1${ny ? "&ny=1" : ""}&utm_source=email&utm_medium=${medium}&utm_campaign=${ny ? "ny" : "gift"}${ny ? `#${NY_ANCHOR}` : ""}`;
}
