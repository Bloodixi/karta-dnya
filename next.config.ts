import type { NextConfig } from "next";

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
  ],
};

export default nextConfig;
