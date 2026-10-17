import type { NextConfig } from "next";

// Префикс короткой ссылки → [utm_source, utm_medium].
const SHORT_LINKS: Record<string, [string, string]> = {
  yt: ["youtube", "shorts"],
  tg: ["telegram", "social"],
  vk: ["vk", "social"],
  dz: ["dzen", "social"],
  ig: ["instagram", "social"],
};

const SECURITY_HEADERS = [
  // без preload: из списка предзагрузки браузеров домен потом не убрать быстро
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // form-action: формы сайта уходят на свой адрес; оформление оплаты отвечает 303 на confirmation_url ЮKassa
  // (yoomoney.ru/…), а Chrome проверяет form-action по всей цепочке переадресаций — домены ЮKassa/ЮMoney нужны.
  // script-src не задаём: инлайн-скрипты Next и Метрики потребуют nonce.
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://yoomoney.ru https://*.yoomoney.ru https://yookassa.ru https://*.yookassa.ru",
    ].join("; "),
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

// Личные страницы покупателя (ссылка = доступ к разбору/чеку): адрес не должен уходить в Referer и поисковики.
const PRIVATE_PATHS = ["/r/:path*", "/razbor/r/:path*", "/razbor/chek/:path*", "/razbor/spasibo"];

const nextConfig: NextConfig = {
  output: "standalone",
  images: { unoptimized: true },
  trailingSlash: false,
  poweredByHeader: false,
  // Шрифты для OG-картинок читаются через fs в рантайме (карта дня и луна пересчитываются по дате).
  outputFileTracingIncludes: { "/**": ["./src/app/_og/*.ttf"] },
  // Заголовки безопасности для всех ответов; для личных страниц разбора — без Referer и без индексации.
  // Правило ниже по списку перекрывает тот же заголовок выше (Referrer-Policy у личных страниц).
  headers: async () => [
    { source: "/:path*", headers: SECURITY_HEADERS },
    ...PRIVATE_PATHS.map((source) => ({
      source,
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    })),
  ],
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
    // Статьи, поглощённые инструментами и страницами символов сонника (текст — content/tools и content/data/sonnik-extra).
    { source: "/taro/taro-da-net", destination: "/taro/da-net", permanent: true },
    { source: "/taro/starshie-arkany-taro", destination: "/taro/arkany/starshie", permanent: true },
    { source: "/taro/rasklad-tri-karty", destination: "/taro/tri-karty", permanent: true },
    { source: "/numerologiya/numerologicheskaya-sovmestimost", destination: "/numerologiya/sovmestimost", permanent: true },
    { source: "/numerologiya/znachenie-chisel-na-chasah", destination: "/numerologiya/chisla-na-chasah", permanent: true },
    { source: "/sonnik/k-chemu-snitsya-voda", destination: "/sonnik/voda", permanent: true },
    { source: "/sonnik/k-chemu-snitsya-zmeya", destination: "/sonnik/zmeya", permanent: true },
    { source: "/sonnik/k-chemu-snyatsya-zuby", destination: "/sonnik/zuby", permanent: true },
    { source: "/sonnik/k-chemu-snitsya-beremennost", destination: "/sonnik/beremennost", permanent: true },
    { source: "/sonnik/k-chemu-snitsya-byvshiy", destination: "/sonnik/byvshiy", permanent: true },
    { source: "/sonnik/k-chemu-snyatsya-umershie", destination: "/sonnik/umershiy-rodstvennik", permanent: true },
  ],
};

export default nextConfig;
