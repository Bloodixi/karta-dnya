import Link from "next/link";
import Icon from "@/components/Icons";
import { getArticles, type ArticleMeta } from "@/lib/content";
import { SECTIONS, SECTION_KEYS } from "@/lib/site";

/**
 * Постоянный блок главной «Статьи по разделам»: по каждому разделу со статьями до 5 ссылок —
 * 2 самые свежие и 3 самые давние из тех, что не попали в «Свежие статьи» (`skip`).
 * Так у старых статей остаётся ссылка с главной, когда они уходят из ленты.
 */
export default function SectionArticles({ skip = [] }: { skip?: ArticleMeta[] }) {
  const skipped = new Set(skip.map((a) => a.section + "/" + a.slug));
  const groups = SECTION_KEYS.map((key) => {
    const all = getArticles(key); // от новых к старым
    const rest = all.filter((a) => !skipped.has(a.section + "/" + a.slug));
    const pick = rest.length <= 5 ? rest : [...rest.slice(0, 2), ...rest.slice(-3)];
    return { key, total: all.length, pick };
  }).filter((g) => g.pick.length > 0);
  if (!groups.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 pt-12 pb-4">
      <div className="ornament mb-5"><h2 className="text-3xl">Статьи по разделам</h2><span className="mono">с чего начать</span></div>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ key, total, pick }) => (
          <div key={key}>
            <h3 className="flex items-center gap-2 text-lg font-semibold border-b border-line pb-2 mb-1">
              <Icon name={SECTIONS[key].icon} size={18} className="text-accent" /> {SECTIONS[key].title}
            </h3>
            <ul>
              {pick.map((a) => (
                <li key={a.slug}>
                  <Link href={`/${a.section}/${a.slug}`} className="block py-1.5 text-sm leading-snug hover:text-accent-text">{a.title}</Link>
                </li>
              ))}
            </ul>
            <Link href={`/${key}`} className="mono inline-block mt-1 hover:!text-ink">все статьи раздела ({total}) →</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
