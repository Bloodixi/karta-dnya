import type { NextConfig } from "next";

// Префикс короткой ссылки → [utm_source, utm_medium].
const SHORT_LINKS: Record<string, [string, string]> = {
  yt: ["youtube", "shorts"],
  tg: ["telegram", "social"],
  vk: ["vk", "social"],
  dz: ["dzen", "social"],
  ig: ["instagram", "social"],
};

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  trailingSlash: false,
  poweredByHeader: false,
  // Шрифты для OG-картинок читаются через fs в рантайме (карта дня и луна пересчитываются по дате).
  outputFileTracingIncludes: { "/**": ["./src/app/_og/*.ttf"] },
  // Статьи, которые поглотили отдельные страницы-инструменты: старый адрес статьи → новая страница.
  redirects: async () => [
    // Единое зеркало: www → основной домен (постоянная переадресация, чтобы не плодить дубли в индексе).
    {
      source: "/:path*",
      has: [{ type: "host", value: "www.karta-dnya.ru" }],
      destination: "https://karta-dnya.ru/:path*",
      permanent: true,
    },
    { source: "/astrologiya/voshodyaschiy-znak-asc", destination: "/astrologiya/voshodyaschiy-znak", permanent: true },
    // Короткие ссылки для описаний роликов и постов: karta-dnya.ru/yt/chislo-sudby → страница с UTM-метками площадки.
    // Временная переадресация: метки могут поменяться, браузеры не должны её запоминать.
    ...Object.entries(SHORT_LINKS).flatMap(([key, [source, medium]]) => [
      { source: `/${key}`, destination: `/?utm_source=${source}&utm_medium=${medium}`, permanent: false },
      { source: `/${key}/:path+`, destination: `/:path+?utm_source=${source}&utm_medium=${medium}`, permanent: false },
    ]),
  ],
};

export default nextConfig;
