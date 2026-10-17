/**
 * Сервис-воркер сайта (/sw.js), рукописный, без библиотек. Отдаётся как статический файл, собранный при сборке:
 * версия кэша — время сборки, после выкладки старые кэши удаляются.
 * - /_next/static, /cards, /icons, логотипы — cache-first (имена файлов с хешем или неизменные картинки);
 * - главная и /karta-dnya — stale-while-revalidate, но копия прошлых суток по Москве не показывается, пока есть сеть
 *   (карта дня меняется в 00:00 МСК);
 * - остальные страницы — только сеть; без сети — сохранённая копия, если есть, иначе страница «Нет связи» (/offline).
 * Регистрирует его ServiceWorkerRegister только в production.
 */
export const dynamic = "force-static";

const VERSION = Date.now().toString(36);

function worker(version: string) {
  return `"use strict";
const VERSION = ${JSON.stringify(version)};
const STATIC = "kd-static-" + VERSION;
const PAGES = "kd-pages-" + VERSION;
const OFFLINE = "/offline";
const SWR_PAGES = ["/", "/karta-dnya"];
const STATIC_PREFIXES = ["/_next/static/", "/cards/", "/icons/", "/logo-"];
const MSK = 3 * 3600 * 1000, DAY = 86400 * 1000;
const mskDay = (ms) => Math.floor((ms + MSK) / DAY);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.addAll([OFFLINE])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kd-") && k !== STATIC && k !== PAGES).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") cache.put(request, res.clone());
  return res;
}

// страницы храним по пути без параметров (?utm_… не плодит копий)
const pageKey = (request) => new URL(request.url).pathname;

async function fallback(request) {
  const cache = await caches.open(PAGES);
  return (await cache.match(pageKey(request))) || (await cache.match(OFFLINE)) || Response.error();
}

async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(PAGES);
  const cached = await cache.match(pageKey(request));
  const fresh = fetch(request).then((res) => {
    if (res.ok && res.type === "basic" && !res.redirected) return cache.put(pageKey(request), res.clone()).then(() => res);
    return res;
  });
  if (cached) {
    const date = Date.parse(cached.headers.get("date") || "");
    // копия сегодняшняя (по Москве) — отдаём сразу, обновляем в фоне
    if (date && mskDay(date) === mskDay(Date.now())) {
      event.waitUntil(fresh.catch(() => undefined));
      return cached;
    }
  }
  try {
    return await fresh;
  } catch (e) {
    return cached || fallback(request);
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (STATIC_PREFIXES.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.mode !== "navigate") return;
  if (SWR_PAGES.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidate(event));
    return;
  }
  event.respondWith(fetch(request).catch(() => fallback(request)));
});
`;
}

export function GET() {
  return new Response(worker(VERSION), {
    headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
