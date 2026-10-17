import type { Metadata } from "next";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import HubHeader from "@/components/HubHeader";
import StoneShowcase, { type ShowcaseSign, type ShowcaseStone } from "@/components/StoneShowcase";
import { getArticles, getStoneImages, getStones, getZodiac } from "@/lib/content";
import { SECTIONS, SECTION_TOOLS } from "@/lib/site";
import { COLOR_GROUPS, stoneColorKeys } from "@/lib/stoneColors";
import { getStoneSigns } from "@/lib/stones";

export const metadata: Metadata = {
  title: "Камни и талисманы: свойства минералов и кому подходят",
  description: "Каталог камней и минералов: свойства, цвет, чакра, кому подходит по знаку зодиака, как носить и очищать. Аметист, розовый кварц, турмалин, цитрин и другие.",
  alternates: { canonical: "/kamni" },
};

export default function StonesPage() {
  const stones = getStones();
  const images = getStoneImages();
  const articles = getArticles("kamni");
  const stoneSigns = getStoneSigns();

  const items: ShowcaseStone[] = stones.map((s) => ({
    slug: s.slug,
    name: s.name,
    color: s.color,
    properties: s.properties,
    zodiac: s.zodiac,
    colors: stoneColorKeys(s.color),
    thumb: images[s.slug]?.thumb ?? null,
  }));
  const usedColors = new Set(items.flatMap((s) => s.colors));
  const colors = COLOR_GROUPS.filter((g) => usedColors.has(g.key)).map(({ key, label, swatch }) => ({ key, label, swatch }));
  const signs: ShowcaseSign[] = getZodiac().map((z) => ({ slug: z.slug, name: z.name, symbol: z.symbol, order: stoneSigns[z.slug]?.main ?? [] }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }]} />
      <HubHeader icon={SECTIONS.kamni.icon} title="Камни и талисманы" lede={SECTIONS.kamni.description} links={(SECTION_TOOLS.kamni || []).filter((t) => t.href !== "/kamni")} />
      {stones.length ? (
        <StoneShowcase stones={items} colors={colors} signs={signs} />
      ) : (
        <p className="text-muted mt-6">Каталог готовится.</p>
      )}
      {stones.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-2xl mb-3">Как выбрать камень</h2>
          <div className="text-muted space-y-3 leading-relaxed">
            <p>
              Начните с цвета, который вам приятен: к камню, на который хочется смотреть, проще привыкнуть, и носить его вы будете охотнее. Фильтр по цвету собирает камни одного оттенка — так удобно сравнить, например, аметист, чароит и лепидолит.
            </p>
            <p>
              По традиции камни подбирают и по знаку зодиака. Выберите свой знак в фильтре или откройте{" "}
              <Link href="/kamni/po-znaku-zodiaka" className="text-accent-text underline underline-offset-4 hover:text-ink">камни по знаку зодиака</Link>{" "}
              с пояснениями, а если хотите учесть ещё и число судьбы — воспользуйтесь{" "}
              <Link href="/kamni/po-date-rozhdeniya" className="text-accent-text underline underline-offset-4 hover:text-ink">подбором по дате рождения</Link>.
            </p>
          </div>
        </section>
      )}
      {articles.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Статьи</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => <ArticleCard key={a.slug} a={a} />)}
          </div>
        </section>
      )}
    </div>
  );
}
