import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import PairPicker from "@/components/PairPicker";
import ZodiacSign from "@/components/ZodiacSign";
import { getZodiac, getZodiacPairText } from "@/lib/content";
import { pageTitle } from "@/lib/site";
import { allPairs, canonicalPairSlug, compatibility, parsePair } from "@/lib/compat";

export const dynamicParams = false;

export function generateStaticParams() {
  return allPairs().map((p) => ({ pair: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/sovmestimost/[pair]">): Promise<Metadata> {
  const { pair } = await params;
  const p = parsePair(pair);
  if (!p) return {};
  const canonical = canonicalPairSlug(p.a, p.b);
  const t = getZodiacPairText(canonical);
  // зеркальная страница (lev-oven) — те же тексты, имена в порядке адреса; canonical всё равно на основную
  const swap = (s: string) => (canonical === pair ? s : s.replace(`${p.b.name} и ${p.a.name}`, `${p.a.name} и ${p.b.name}`));
  return {
    title: pageTitle(swap(t?.title ?? `${p.a.name} и ${p.b.name}: совместимость в любви и дружбе`)),
    description: t ? swap(t.description) : undefined,
    alternates: { canonical: `/sovmestimost/${canonical}` },
  };
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm"><span>{label}</span><b>{value}%</b></div>
      <div className="h-2 rounded-full bg-sunk mt-1 overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${value}%` }} /></div>
    </div>
  );
}

const PLURAL: Record<string, string> = {
  Овен: "Овны", Телец: "Тельцы", Близнецы: "Близнецы", Рак: "Раки", Лев: "Львы", Дева: "Девы",
  Весы: "Весы", Скорпион: "Скорпионы", Стрелец: "Стрельцы", Козерог: "Козероги", Водолей: "Водолеи", Рыбы: "Рыбы",
};

/** Текстовый вариант глифа знака: без него телефоны рисуют цветные эмодзи. */
const VS = "\uFE0E";

export default async function PairPage({ params }: PageProps<"/sovmestimost/[pair]">) {
  const { pair } = await params;
  const p = parsePair(pair);
  if (!p) notFound();
  const c = compatibility(p.a, p.b);
  const signs = getZodiac();
  const sameA = signs.filter((b) => b.slug !== p.b.slug).slice(0, 11);
  const canonical = canonicalPairSlug(p.a, p.b);
  const mirror = canonical !== pair;
  const t = getZodiacPairText(canonical);
  // в данных heA: «он» — первый знак основного адреса, «она» — второй; заголовки строим в порядке текущего адреса
  const [heText, sheText] = mirror ? [t?.sheA ?? "", t?.heA ?? ""] : [t?.heA ?? "", t?.sheA ?? ""];
  const gender = !t ? [] : p.a.slug === p.b.slug
    ? [{ id: `on-ona-${p.a.slug}`, title: `Он и она — ${PLURAL[p.a.name] ?? p.a.name}`, text: t.heA }]
    : [
        { id: `on-${p.a.slug}-ona-${p.b.slug}`, title: `Он — ${p.a.name}, она — ${p.b.name}`, text: heText },
        { id: `ona-${p.a.slug}-on-${p.b.slug}`, title: `Она — ${p.a.name}, он — ${p.b.name}`, text: sheText },
      ];
  const swapNames = (s: string) => (mirror ? s.replaceAll(`${p.b.name} и ${p.a.name}`, `${p.a.name} и ${p.b.name}`) : s);
  const faq = t ? t.faq.map((f) => ({ q: swapNames(f.q), a: f.a })) : [];
  const toc: [string, string][] = [
    ["lyubov", "В любви"], ["brak", "В браке"], ["druzhba", "В дружбе"], ["rabota", "В работе"], ["blizost", "Близость"],
    ...gender.map((g): [string, string] => [g.id, g.title]),
    ["silnye", "Сильные стороны"], ["trudnosti", "Трудности"], ["faq", "Вопросы"],
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/sovmestimost", label: "Совместимость" }, { href: `/sovmestimost/${pair}`, label: `${p.a.name} и ${p.b.name}` }]} />
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex shrink-0 -space-x-3">
          <ZodiacSign symbol={p.a.symbol} element={p.a.element} slug={`pa-${p.a.slug}`} size={72} className="size-14 sm:size-[72px]" />
          <ZodiacSign symbol={p.b.symbol} element={p.b.element} slug={`pb-${p.b.slug}`} size={72} className="size-14 sm:size-[72px]" />
        </div>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <h1 className="text-[1.6rem] leading-tight sm:text-3xl md:text-4xl font-semibold">{p.a.name} и {p.b.name}: совместимость</h1>
          <p className="text-muted mt-1">{p.a.element} и {p.b.element} · {c.verdict}</p>
        </div>
      </div>
      {t && (
        <nav aria-label="Разделы страницы" className="mt-5 text-sm">
          <ul className="flex flex-wrap gap-2">
            {toc.map(([id, label]) => (
              <li key={id}><a href={`#${id}`} className="chip hover:text-ink">{label}</a></li>
            ))}
          </ul>
        </nav>
      )}
      <div className="mt-6 grid gap-6 md:grid-cols-[280px_1fr] items-start">
        <div className="card p-6 text-center md:sticky md:top-24">
          <p className="display text-6xl">{c.score}%</p>
          <p className="text-muted">общая совместимость</p>
          <div className="grid gap-3 mt-5 text-left">
            <Bar label="Любовь" value={c.love} />
            <Bar label="Дружба" value={c.friendship} />
            <Bar label="Работа" value={c.work} />
          </div>
        </div>
        <div className="prose [&_h2]:scroll-mt-24">
          <p>{c.text.general}</p>
          {t ? (
            <>
              <h2 id="lyubov">В любви</h2>
              <p>{t.love}</p>
              <h2 id="brak">В браке и быту</h2>
              <p>{t.brak}</p>
              <h2 id="druzhba">В дружбе</h2>
              <p>{t.druzhba}</p>
              <h2 id="rabota">В работе</h2>
              <p>{t.rabota}</p>
              <h2 id="blizost">Близость и нежность</h2>
              <p>{t.blizost}</p>
              {gender.map((g) => (
                <section key={g.id} aria-labelledby={g.id}>
                  <h2 id={g.id}>{g.title}</h2>
                  <p>{g.text}</p>
                </section>
              ))}
              <p>{t.neutral}</p>
              <h2 id="silnye">Сильные стороны пары</h2>
              <p>{t.strengths}</p>
              <h2 id="trudnosti">Где может быть трудно и что помогает</h2>
              <p>{t.trudnosti}</p>
            </>
          ) : (
            <>
              <h2>В любви</h2>
              <p>{c.text.love}</p>
              <h2>В быту и общих планах</h2>
              <p>{c.text.life}</p>
            </>
          )}
          <h2>Совет паре</h2>
          <blockquote>{c.text.advice}</blockquote>
          <p>
            Подробнее о знаках: <Link href={`/goroskop/${p.a.slug}`}>{p.a.name}</Link> и <Link href={`/goroskop/${p.b.slug}`}>{p.b.name}</Link>. Почему одни сочетания складываются легче других, объясняет статья <Link href="/astrologiya/sovmestimost-znakov-zodiaka">об основах совместимости знаков</Link>.
            {p.a.slug !== p.b.slug && <> Обратная пара: <Link href={`/sovmestimost/${p.b.slug}-${p.a.slug}`}>{p.b.name} и {p.a.name}</Link>.</>}
          </p>
        </div>
      </div>
      {t && <div id="faq" className="scroll-mt-24"><Faq items={faq} /></div>}
      <section className="mt-10 max-w-2xl">
        <h2 className="text-2xl mb-3">Проверить другую пару</h2>
        <PairPicker signs={signs} initial={[p.a.slug, p.b.slug]} />
      </section>
      <section className="mt-10">
        <h2 className="text-2xl mb-3">{p.a.name} с другими знаками</h2>
        <div className="flex flex-wrap gap-2">
          {sameA.map((b) => (
            <Link key={b.slug} href={`/sovmestimost/${p.a.slug}-${b.slug}`} className="chip hover:text-ink">{b.symbol}{VS} {b.name} · {compatibility(p.a, b).score}%</Link>
          ))}
        </div>
      </section>
    </div>
  );
}
