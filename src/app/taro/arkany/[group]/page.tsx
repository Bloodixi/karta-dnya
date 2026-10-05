import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import TarotCardView from "@/components/TarotCardView";
import { getTarot } from "@/lib/content";

export const dynamicParams = false;

const GROUPS = {
  starshie: {
    title: "Старшие арканы Таро: 22 карты и их значения",
    h1: "Старшие арканы Таро",
    description: "22 старших аркана Таро от Шута до Мира: значение каждой карты, ключевые слова, прямое и перевёрнутое положение, роль в раскладе.",
    intro: "Старшие арканы описывают большие темы и поворотные моменты: судьбу, выбор, кризис, рост. Если в раскладе их много, ситуация важнее, чем кажется, и зависит не только от повседневных решений.",
    filter: (c: { arcana: string }) => c.arcana === "major",
    faq: [
      { q: "Сколько старших арканов в Таро?", a: "22 карты, от Шута (0) до Мира (21). Они составляют «большой» цикл колоды." },
      { q: "Что значит, если в раскладе много старших арканов?", a: "Ситуация значимая и во многом не зависит от мелких действий: речь о больших переменах, уроках и выборах." },
      { q: "С какой карты начинать изучение?", a: "С Шута и Мага: они открывают путь героя и задают язык всей колоды." },
    ],
  },
  mladshie: {
    title: "Младшие арканы Таро: 56 карт четырёх мастей",
    h1: "Младшие арканы Таро",
    description: "56 младших арканов Таро: жезлы, кубки, мечи и пентакли, от туза до короля. Значения карт, за что отвечает каждая масть, как читать числа и фигуры.",
    intro: "Младшие арканы описывают повседневность: дела, чувства, мысли и деньги. Жезлы отвечают за энергию и действие, Кубки за чувства, Мечи за ум и конфликты, Пентакли за материальное.",
    filter: (c: { arcana: string }) => c.arcana === "minor",
    faq: [
      { q: "За что отвечает каждая масть?", a: "Жезлы — энергия, творчество, инициатива; Кубки — чувства и отношения; Мечи — мысли, решения, конфликты; Пентакли — деньги, работа, здоровье." },
      { q: "Как читать числа младших арканов?", a: "Туз — начало, 2–3 — развитие, 4–6 — стабилизация и испытания, 7–9 — усилие и зрелость, 10 — завершение цикла." },
      { q: "Что значат фигурные карты?", a: "Паж — ученик и весть, Рыцарь — действие, Королева — зрелое владение качеством масти, Король — власть и ответственность." },
    ],
  },
} as const;

type GroupKey = keyof typeof GROUPS;

export function generateStaticParams() {
  return Object.keys(GROUPS).map((group) => ({ group }));
}

export async function generateMetadata({ params }: PageProps<"/taro/arkany/[group]">): Promise<Metadata> {
  const { group } = await params;
  const g = GROUPS[group as GroupKey];
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/taro/arkany/${group}` } };
}

export default async function ArcanaPage({ params }: PageProps<"/taro/arkany/[group]">) {
  const { group } = await params;
  const g = GROUPS[group as GroupKey];
  if (!g) notFound();
  const cards = getTarot().filter(g.filter);
  const suits = ["zhezly", "kubki", "mechi", "pentakli"];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/karty", label: "Значения карт" }, { href: `/taro/arkany/${group}`, label: g.h1 }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">{g.h1}</h1>
      <p className="text-muted mt-2 max-w-2xl text-lg">{g.intro}</p>
      {group === "starshie" ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="card card-hover p-4 flex gap-4">
              <span className="w-20 shrink-0"><TarotCardView slug={c.slug} name={c.name} className="tcard-thumb" sizes="80px" /></span>
              <span>
                <p className="text-xs text-muted">{c.number}</p>
                <p className="font-semibold text-lg">{c.name}</p>
                <p className="text-sm text-muted mt-1">{c.keywords.join(" · ")}</p>
                <p className="text-sm mt-2 line-clamp-3">{c.upright}</p>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        suits.map((suit) => {
          const list = cards.filter((c) => c.suit === suit).sort((a, b) => a.number - b.number);
          if (!list.length) return null;
          return (
            <section key={suit} className="mt-8">
              <h2 className="text-2xl mb-3">{list[0].suitName}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {list.map((c) => (
                  <Link key={c.slug} href={`/taro/karty/${c.slug}`} className="card card-hover p-3 text-center">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-muted mt-1">{c.keywords.slice(0, 2).join(", ")}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
      <p className="mt-8 text-muted text-sm">
        См. также: <Link href={`/taro/arkany/${group === "starshie" ? "mladshie" : "starshie"}`} className="text-accent underline">{group === "starshie" ? "младшие арканы" : "старшие арканы"}</Link>, <Link href="/taro/karty" className="text-accent underline">все 78 карт</Link>, <Link href="/karta-dnya" className="text-accent underline">карта дня</Link>.
      </p>
      <Faq items={[...g.faq]} />
    </div>
  );
}
