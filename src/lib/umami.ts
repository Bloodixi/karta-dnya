/**
 * Umami — своя аналитика на нашем сервере (stat.karta-dnya.ru, Coolify-сервис «umami»), рядом с Метрикой.
 * Без cookies; адреса уходят без параметров запроса (в них бывают даты рождения и имена).
 * Скрипт и приём событий идут через наш домен: /u/k.js и /u/api/send → внутренний адрес сервиса (next.config.ts).
 */
export const UMAMI_WEBSITE_ID = "8b11cb09-0e03-486b-9cce-1afc39090eb9";
/** Внутренний адрес сервиса в docker-сети coolify; локально переопределяется UMAMI_INTERNAL_URL. */
export const UMAMI_INTERNAL_URL = process.env.UMAMI_INTERNAL_URL ?? "http://umami-bz2indwtxdrc4wgxkwzzcoaw:3000";

type Umami = { track: (...args: unknown[]) => void };

/** Событие из браузера (цель). Скрипта может не быть (блокировщик, личная страница) — тогда молча ничего. */
export function umamiTrack(name: string, data?: Record<string, string | number>) {
  try {
    (window as unknown as { umami?: Umami }).umami?.track(name, data);
  } catch {}
}
