/**
 * Umami — своя аналитика на нашем сервере (stat.karta-dnya.ru, Coolify-сервис «umami»), рядом с Метрикой.
 * Без cookies; адреса уходят без параметров запроса (в них бывают даты рождения и имена).
 * Скрипт и приём событий идут через наш домен: /u/k.js и /u/api/send → внутренний адрес сервиса (next.config.ts).
 */
export const UMAMI_WEBSITE_ID = "8b11cb09-0e03-486b-9cce-1afc39090eb9";
/** Внутренний адрес сервиса в docker-сети coolify; локально переопределяется UMAMI_INTERNAL_URL. */
export const UMAMI_INTERNAL_URL = process.env.UMAMI_INTERNAL_URL ?? "http://umami-bz2indwtxdrc4wgxkwzzcoaw:3000";

type Umami = { track: (...args: unknown[]) => void };

/** Личные страницы покупателя (адрес = доступ к разбору или чеку): туда статистика не ходит. */
export const isPrivateUmamiPath = (path: string) => /^\/(r|razbor\/r|razbor\/chek)(\/|$)/.test(path) || /^\/razbor\/spasibo\/?$/.test(path);

/** Откуда пришли: только сайт и путь, без ?параметров; личные страницы — не передаём. */
export function cleanReferrer(ref: string): string {
  try {
    const u = new URL(ref);
    if (u.origin === location.origin && isPrivateUmamiPath(u.pathname)) return "";
    return `${u.origin}${u.pathname}`;
  } catch {
    return "";
  }
}

/** Событие из браузера (цель). Скрипта может не быть (блокировщик, личная страница) — тогда молча ничего. */
export function umamiTrack(name: string, data?: Record<string, string | number>) {
  try {
    if (isPrivateUmamiPath(location.pathname)) return;
    // адрес — только путь: в параметрах бывают даты рождения и имена
    (window as unknown as { umami?: Umami }).umami?.track((p: Record<string, unknown>) => ({ ...p, url: location.pathname, referrer: cleanReferrer(document.referrer), name, ...(data ? { data } : {}) }));
  } catch {}
}
