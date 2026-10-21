import { getArticles, type ArticleMeta } from "@/lib/content";

/**
 * Ссылки с инструментов и хабов на статьи их темы — блок «Подробнее по теме» (`ArticleLinks`).
 *
 * Ключ — путь страницы. Точный путь (`/kvadrat-pifagora`) или шаблон с `*` на месте динамического
 * сегмента (`/chislo-sudby/*`, `/kamni/*`). Значение — статьи в виде `<раздел>/<slug>` из content/articles.
 * Страница собирает статьи по всем подходящим ключам (сначала точный путь, потом шаблоны),
 * без повторов, не больше 3. Несуществующие slug молча пропускаются — карту можно дописывать заранее.
 *
 * Конвейер статей: выпустил статью — допиши её сюда к 1–3 страницам её темы.
 */
export const ARTICLE_LINKS: Record<string, string[]> = {
  // Нумерология
  "/numerologiya/chislo-imeni": ["numerologiya/chislo-imeni-numerologiya"],
  "/numerologiya/master-chisla": ["numerologiya/master-chisla-11-22-33", "numerologiya/chislo-sudby-po-date-rozhdeniya"],
  "/chislo-sudby": ["numerologiya/chislo-sudby-po-date-rozhdeniya", "numerologiya/chislo-sudby-1-9-znachenie", "numerologiya/master-chisla-11-22-33"],
  "/chislo-sudby/11": ["numerologiya/master-chisla-11-22-33"],
  "/chislo-sudby/22": ["numerologiya/master-chisla-11-22-33"],
  "/chislo-sudby/33": ["numerologiya/master-chisla-11-22-33"],
  "/chislo-sudby/*": ["numerologiya/chislo-sudby-1-9-znachenie", "numerologiya/chislo-sudby-po-date-rozhdeniya"],
  "/kvadrat-pifagora": ["numerologiya/kvadrat-pifagora", "numerologiya/chislo-sudby-po-date-rozhdeniya"],
  "/matrica-sudby": ["numerologiya/matrica-sudby-rasshifrovka"],

  // Таро
  "/karta-dnya": ["taro/karta-dnya-taro-kak-ispolzovat", "taro/kak-nachat-gadat-na-taro"],
  "/taro/rasklady/keltskiy-krest": ["taro/keltskiy-krest-taro", "taro/perevernutye-karty-taro"],
  "/taro/rasklady/na-god": ["taro/rasklad-taro-na-novyy-god", "praktiki/novogodnie-i-svyatochnye-gadaniya"],
  "/taro/rasklady/na-otnosheniya": ["taro/rasklad-taro-na-otnosheniya"],
  "/taro/rasklady/na-lyubov": ["taro/rasklad-taro-na-otnosheniya"],
  "/taro/rasklady/*": ["taro/kak-nachat-gadat-na-taro"],
  "/taro/arkany/mladshie": ["taro/mladshie-arkany-taro"],
  "/taro/arkany/starshie": ["taro/perevernutye-karty-taro"],
  // Страницы младших арканов (/taro/karty/<slug> с arcana: "minor") — отдельный ключ, его передаёт страница карты.
  "taro-minor": ["taro/mladshie-arkany-taro"],
  "/taro/karty/*": ["taro/kak-nachat-gadat-na-taro"],

  // Астрология и Луна
  "/astrologiya/natalnaya-karta": ["astrologiya/natalnaya-karta-chto-eto", "astrologiya/doma-v-astrologii", "astrologiya/voshodyaschiy-znak"],
  "/lunnyy-kalendar": ["astrologiya/lunnyy-kalendar-kak-polzovatsya", "astrologiya/fazy-luny-znachenie", "praktiki/ritual-na-novolunie"],
  "/lunnyy-kalendar/*": ["astrologiya/lunnyy-kalendar-kak-polzovatsya", "astrologiya/fazy-luny-znachenie", "praktiki/ritual-na-novolunie"],
  "/goroskop/*/nedelya": ["astrologiya/goroskop-na-nedelyu-kak-chitat"],
  "/goroskop/*/*": ["astrologiya/znaki-zodiaka-po-datam"],

  // Камни
  "/kamni/po-znaku-zodiaka": ["kamni/kamni-po-znaku-zodiaka", "kamni/kak-ochistit-kamni"],
  "/kamni/po-znaku-zodiaka/*": ["kamni/kamni-po-znaku-zodiaka", "astrologiya/znaki-zodiaka-po-datam"],
  // «Денежные» камни из статьи kamni-dlya-deneg
  "/kamni/citrin": ["kamni/kamni-dlya-deneg", "praktiki/ritual-na-dengi"],
  "/kamni/pirit": ["kamni/kamni-dlya-deneg", "praktiki/ritual-na-dengi"],
  "/kamni/aventurin": ["kamni/kamni-dlya-deneg", "praktiki/ritual-na-dengi"],
  "/kamni/tigrovyy-glaz": ["kamni/kamni-dlya-deneg", "praktiki/ritual-na-dengi"],
  "/kamni/nefrit": ["kamni/kamni-dlya-deneg", "praktiki/ritual-na-dengi"],
  "/kamni/*": ["kamni/kak-ochistit-kamni"],

  // Практики
  "/praktiki": ["praktiki/chto-takoe-ezoterika", "praktiki/energetika-cheloveka", "praktiki/chakry-znachenie"],
  "/praktiki/affirmacii": ["praktiki/affirmacii-na-kazhdyy-den"],
  "/praktiki/affirmacii/na-dengi": ["praktiki/ritual-na-dengi", "kamni/kamni-dlya-deneg"],
  "/praktiki/affirmacii/*": ["praktiki/affirmacii-na-kazhdyy-den", "praktiki/meditatsiya-dlya-nachinayushchih"],
  "/runy": ["praktiki/gadanie-na-runah-dlya-nachinayushchih"],
  "/runy/*": ["praktiki/gadanie-na-runah-dlya-nachinayushchih"],
};

function matches(pattern: string, path: string) {
  if (!pattern.includes("*")) return pattern === path;
  const a = pattern.split("/");
  const b = path.split("/");
  return a.length === b.length && a.every((seg, i) => seg === "*" || seg === b[i]);
}

/** Статьи для страницы: по точным ключам, затем по шаблонам; `keys` — путь и, при нужде, доп. ключи (`taro-minor`). */
export function articlesFor(keys: string | string[], limit = 3): ArticleMeta[] {
  const list = Array.isArray(keys) ? keys : [keys];
  const exact = Object.keys(ARTICLE_LINKS).filter((k) => list.includes(k));
  const wild = Object.keys(ARTICLE_LINKS).filter((k) => k.includes("*") && list.some((p) => matches(k, p)));
  const all = getArticles();
  const out: ArticleMeta[] = [];
  for (const ref of [...exact, ...wild].flatMap((k) => ARTICLE_LINKS[k])) {
    const a = all.find((x) => `${x.section}/${x.slug}` === ref);
    if (a && !out.includes(a)) out.push(a);
    if (out.length >= limit) break;
  }
  return out;
}
