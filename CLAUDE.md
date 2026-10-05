# karta-dnya.ru — эзотерический портал (Next.js 16, App Router, Tailwind v4)

Отдельный git-репозиторий `Bloodixi/karta-dnya`, деплой через Coolify на VPS (Dockerfile standalone). Нет БД: контент в `content/articles/<section>/*.md` и `content/data/*.json`, ежедневные вещи (карта дня, гороскоп, луна) считаются детерминированно от даты по Москве (`src/lib/daily.ts`, `src/lib/moon.ts`).

## Карта кода
- `src/app/**/page.tsx` — страницы; динамические сегменты со `generateStaticParams` и `dynamicParams = false`.
- `src/lib/content.ts` — чтение Markdown/JSON (`getX`/`findX`); `src/lib/site.ts` — `SITE`, `SECTIONS`, `TOOLS`.
- `src/components/` — `Breadcrumbs` (BreadcrumbList), `Faq` (FAQPage), `JsonLd`, виджеты (`YesNo`, `DestinyCalc`, `Pythagoras`, …) — client-компоненты только для интерактива.
- Визуал: `TarotCardView` (картинка карты из `public/cards/<slug>[-160|@2x].webp`, колода Райдера–Уэйта, рубашка `CardBack`, переворот классами `.tcard`), `ZodiacSign` (SVG-медальон знака по стихии), `MoonPhase` (SVG фазы по возрасту Луны), `Starfield` + секция `.night`, `Icon`/`IconBadge` вместо эмодзи (имена в `site.ts`).
- `src/app/sitemap.ts`, `robots.ts` — каждый новый тип страниц добавлять в sitemap.
- `docs/seo-core.md` — 100 запросов и целевые URL; `content/plan.json` — план из 50 статей (пишутся конвейером `../board.sh content`).

## Правила
- Каждая страница: один `<h1>`, `generateMetadata` с уникальным title (≤ 65), description 140–160, `alternates.canonical`, `Breadcrumbs` сверху, внутренние ссылки на соседей и инструменты.
- Цвета и шрифты только через токены `globals.css` (`bg`, `surface`, `ink`, `muted`, `accent`, `gold`; `font-display`/`font-sans`). Классы `card`, `chip`, `.prose`.
- Тексты: русский, спокойный тон, без запугивания, медицинских/финансовых обещаний и упоминаний ИИ.
- Перед коммитом `npm run lint && npm run build`. Коммиты по-русски одной строкой.
- Рабочие скилы в `/home/proect/.claude/skills`: `karta-dnya-page-type`, `karta-dnya-article`, `karta-dnya-seo-check`, `karta-dnya-deploy`. Проверка: `python3 /home/proect/tools/site/seo-check.py`, `/home/proect/tools/site/lighthouse.sh`.

@AGENTS.md
