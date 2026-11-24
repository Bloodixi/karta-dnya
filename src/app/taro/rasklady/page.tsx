import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import RazborCta from "@/components/RazborCta";
import RazborLink from "@/components/RazborLink";
import Spread from "@/components/Spread";
import Faq from "@/components/Faq";
import { getSpreads, getTarot, spreadHref } from "@/lib/content";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Расклады Таро онлайн: 10 бесплатных раскладов",
  description: "Расклады Таро онлайн бесплатно: на одну и три карты, на любовь, отношения, работу, год, «Подкова», «Кельтский крест», «да или нет» и совет дня. Значения позиций.",
  alternates: { canonical: "/taro/rasklady" },
};

const FAQ = [
  { q: "Как выбрать расклад?", a: "Начните с вопроса. Для быстрого ответа подойдёт одна карта или «да или нет», для ситуации во времени — три карты, для чувств — расклады на любовь и отношения, для важного запутанного вопроса — «Подкова» или «Кельтский крест»." },
  { q: "Онлайн-расклад работает так же, как с настоящей колодой?", a: "Карты выбираются случайно из полной колоды в 78 карт, часть выпадает перевёрнутыми, и каждая карта в раскладе уникальна. Смысл чтения тот же: значение карты в значении позиции." },
  { q: "Сколько раз можно делать один расклад?", a: "Один вопрос — один расклад. Если результат непонятен, лучше уточнить вопрос и выбрать другой расклад, чем раскладывать те же карты снова." },
  { q: "Нужно ли знать значения всех карт?", a: "Нет. Под каждой картой показано короткое значение для её положения, а по ссылке открывается полная страница карты с толкованием для любви, работы и советом." },
];

const ITOGI_2026_POSITIONS = [
  { name: "Главный итог 2026", meaning: "Что стало самым важным опытом, опорой и результатом уходящего года." },
  { name: "Что оставить в 2026", meaning: "От каких привычек, ожиданий или лишних обязательств стоит спокойно освободиться." },
  { name: "Фокус 2027", meaning: "На что опереться и куда направить внимание в новом году." },
];

function count(n: number) {
  return `${n} ${n === 1 ? "карта" : n < 5 ? "карты" : "карт"}`;
}

export default function SpreadsHubPage() {
  const spreads = getSpreads();
  const cards = getTarot().map((c) => ({ slug: c.slug, name: c.name, upright: c.upright, reversed: c.reversed }));
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/taro", label: "Таро" }, { href: "/taro/rasklady", label: "Расклады" }]} />
      <h1 className="text-3xl md:text-4xl">Расклады Таро онлайн</h1>
      <div className="mt-3 max-w-3xl grid gap-3 text-lg text-muted">
        <p>Онлайн-расклады Таро помогают бесплатно получить подсказку по вопросу на полную колоду Райдера–Уэйта из 78 карт. Здесь собраны десять раскладов: от одной карты и гадания «да или нет» до «Кельтского креста» и годового круга. Карты вытягиваются случайно с учётом перевёрнутых положений и сразу показывают краткое значение.</p>
        <p>Расклад стоит выбирать по вопросу, а не по числу карт. Когда нужен быстрый ответ, достаточно одной карты или гадания «да или нет». Если важно увидеть ситуацию во времени, подойдут три карты или «Подкова». Чувства и пару лучше рассматривать через расклады на любовь и отношения, а для серьёзного запутанного вопроса есть «Кельтский крест». Для ежедневной практики подойдут «Совет дня» и <Link href="/karta-dnya" className="text-accent-text underline">карта дня</Link>, а значения всех карт собраны в <Link href="/taro/karty" className="text-accent-text underline">каталоге карт Таро</Link>.</p>
      </div>

      <section id="itogi-2026" className="mt-8 scroll-mt-24">
        <div className="ornament mb-3">
          <h2 className="text-2xl">Сезонный расклад: Итоги 2026 → фокус 2027</h2>
          <span className="mono">3 карты</span>
        </div>
        <p className="text-muted max-w-3xl mb-4">
          Быстрый переходный расклад прямо здесь: три карты покажут, что важно забрать с собой из 2026 года, что оставить позади и на чём сосредоточиться в 2027-м. Нужен личный расчёт по месяцам?{" "}
          <RazborLink from="itogi2026" keepFrom className="text-accent-text underline">
            Открыть разбор на 2027 год по дате рождения →
          </RazborLink>
        </p>
        {cards.length ? (
          <Spread
            positions={ITOGI_2026_POSITIONS}
            cards={cards}
            afterDraw={
              <div className="card frame-gold p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">Сравни подсказку карт с твоим личным годом 2027</p>
                  <p className="text-sm text-muted mt-1">
                    В полном разборе по дате рождения — твой личный год 2027, ритм каждого из 12 месяцев, любовь, работа и 5 практических шагов. Бесплатная часть откроется сразу.
                  </p>
                </div>
                <RazborLink from="itogi2026" keepFrom className="btn self-start sm:self-center whitespace-nowrap">
                  Прогноз на 2027 год →
                </RazborLink>
              </div>
            }
          />
        ) : null}
      </section>

      <RazborCta from="taro-rasklady" className="mt-8" />

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Выберите расклад</h2><span className="mono">{spreads.length} раскладов</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spreads.map((s) => (
            <Link key={s.slug} href={spreadHref(s)} className="card card-hover p-5 flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                <span className="chip">{count(s.positions.length)}</span>
                <span className="chip">{s.theme}</span>
              </div>
              <h3 className="text-xl">{s.title}</h3>
              <p className="text-sm text-muted">{s.intro[0].split(". ")[0]}.</p>
              <span className="text-accent-text text-sm mt-auto pt-2">Разложить →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="prose mt-12">
        <h2>Как гадать на Таро онлайн</h2>
        <ol>
          <li><strong>Сформулируйте вопрос.</strong> Один вопрос про себя и свои действия: «что мне важно учесть», «как мне подойти». Вопросы о чужих мыслях и точных датах карты читают плохо.</li>
          <li><strong>Выберите расклад по вопросу.</strong> Короткий вопрос — короткий расклад. Большие схемы имеют смысл, когда ситуация запутанная и у неё несколько участников.</li>
          <li><strong>Разложите карты и прочитайте каждую в своей позиции.</strong> Значение карты всегда уточняется смыслом позиции: одна и та же карта в «препятствии» и в «совете» звучит по-разному.</li>
          <li><strong>Посмотрите на расклад целиком.</strong> Сколько карт благоприятных, сколько сложных, сколько перевёрнутых, какие масти преобладают. Общий тон важнее отдельной карты.</li>
          <li><strong>Сделайте вывод одной фразой.</strong> Запишите, что вы поняли, и один шаг, который из этого следует. Так расклад превращается из гадания в размышление.</li>
        </ol>
        <p>Перевёрнутые карты читаются как ослабленное, задержанное или внутреннее проявление значения, а не как противоположность. Если хотите разобраться глубже, начните с <Link href="/taro/kak-nachat-gadat-na-taro">руководства для новичков</Link> и подробного разбора <Link href="/taro/tri-karty">расклада на три карты</Link>.</p>
      </section>
      <Faq items={FAQ} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Расклады Таро онлайн", url: `${SITE.url}/taro/rasklady`, applicationCategory: "LifestyleApplication", operatingSystem: "Any", inLanguage: "ru", offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" } }} />
    </div>
  );
}
