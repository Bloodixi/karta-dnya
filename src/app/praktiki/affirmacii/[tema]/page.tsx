import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { AFFIRM_PATH, findAffirmationTopic, getAffirmationTopics } from "@/lib/affirmations";
import { pageTitle, SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAffirmationTopics().map((t) => ({ tema: t.slug }));
}

export async function generateMetadata({ params }: PageProps<"/praktiki/affirmacii/[tema]">): Promise<Metadata> {
  const { tema } = await params;
  const t = findAffirmationTopic(tema);
  if (!t) return {};
  return { title: pageTitle(t.title), description: t.description, alternates: { canonical: `${AFFIRM_PATH}/${t.slug}` } };
}

export default async function AffirmationTopicPage({ params }: PageProps<"/praktiki/affirmacii/[tema]">) {
  const { tema } = await params;
  const t = findAffirmationTopic(tema);
  if (!t) notFound();
  const others = getAffirmationTopics().filter((o) => o.slug !== t.slug);
  const path = `${AFFIRM_PATH}/${t.slug}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/praktiki", label: "Практики" }, { href: AFFIRM_PATH, label: "Аффирмации" }, { href: path, label: t.h1 }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">{t.h1}</h1>
      <div className="prose mt-4" style={{ maxWidth: "none" }}>
        {t.intro.map((p, i) => <p key={i} className="max-w-3xl">{p}</p>)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`${AFFIRM_PATH}/dnya`} className="btn btn-ghost">Аффирмация дня</Link>
        <Link href={AFFIRM_PATH} className="btn btn-ghost">Все аффирмации</Link>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">{t.items.length} аффирмаций {t.name}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {t.items.map((a, i) => (
            <li key={i} className="card p-4 flex gap-3">
              <span className="font-mono text-xs text-muted pt-1">{String(i + 1).padStart(2, "0")}</span>
              <span>{a}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted mt-3">Формулировки даны в женском роде; при желании замените окончания на привычные вам.</p>
      </section>

      <section className="prose mt-12">
        <h2>Как встроить аффирмации в день</h2>
        {t.how.map((p, i) => <p key={i}>{p}</p>)}
        <p>
          Подготовиться к практике помогут <Link href="/praktiki/dyhatelnye-praktiki">дыхательные упражнения</Link> и <Link href="/praktiki/meditatsiya-dlya-nachinayushchih">короткая медитация</Link>,
          а начинать новые серии удобно с новолуния, когда <Link href="/lunnyy-kalendar">лунный календарь</Link> показывает начало цикла.
          О том, как составлять свои фразы, — в статье <Link href="/praktiki/affirmacii-na-kazhdyy-den">«Аффирмации на каждый день»</Link>.
        </p>
      </section>

      <Faq items={t.faq} />

      <section className="mt-12">
        <h2 className="text-2xl mb-3">Другие подборки аффирмаций</h2>
        <div className="flex flex-wrap gap-2">
          {others.map((o) => <Link key={o.slug} href={`${AFFIRM_PATH}/${o.slug}`} className="chip hover:text-ink">{o.h1}</Link>)}
          <Link href={`${AFFIRM_PATH}/dnya`} className="chip hover:text-ink">Аффирмация дня</Link>
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: t.h1,
          url: `${SITE.url}${path}`,
          itemListElement: t.items.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a })),
        }}
      />
    </div>
  );
}
