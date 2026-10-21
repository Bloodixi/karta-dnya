import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Icon from "@/components/Icons";
import JsonLd from "@/components/JsonLd";
import { authorJsonLd, getAuthors } from "@/lib/authors";
import { CONTACT_EMAIL, ORG_ID, orgJsonLd, pageTitle, SECTIONS, SECTION_KEYS, SITE, SOCIAL, TOOLS } from "@/lib/site";

const PATH = "/o-proekte";
const TITLE = "О проекте: разделы, принципы и контакты";
const DESCRIPTION = "«Карта дня» — портал о Таро, астрологии, нумерологии и снах: какие есть разделы и инструменты, как мы считаем и пишем тексты, кто авторы и как связаться.";

export const metadata: Metadata = {
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
};

const PRINCIPLES: { title: string; text: string }[] = [
  { title: "Развлекательно-познавательный формат", text: "Материалы рассказывают, как символы и расчёты понимает эзотерическая традиция. Это повод задуматься и посмотреть на день под другим углом, а не инструкция и не предсказание." },
  { title: "Без медицинских и финансовых обещаний", text: "Мы не ставим диагнозов, не советуем лечение и не обещаем денег, удачи или событий. Решения о здоровье, деньгах и документах принимаются по фактам и вместе с профильными специалистами." },
  { title: "Спокойный тон", text: "Мы не пугаем и не пишем о порчах и неизбежных бедах. Если тема тревожная, текст подскажет, на что опереться и где стоит быть внимательнее." },
  { title: "Расчёт — по открытой методике", text: "Гороскопы, лунный календарь и транзиты опираются на реальные положения планет и Луны по эфемеридам. Числа и арканы считаются по формулам, которые описаны на страницах инструментов." },
];

export default function AboutPage() {
  const authors = getAuthors();
  const socials = [SOCIAL.telegram, SOCIAL.vk, SOCIAL.youtube, SOCIAL.dzen];
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: PATH, label: "О проекте" }]} />
      <h1 className="text-3xl md:text-4xl">О проекте «{SITE.name}»</h1>
      <p className="text-muted mt-2 max-w-2xl">{SITE.tagline}. Здесь можно вытянуть карту на сегодня, прочитать гороскоп, посчитать число судьбы или найти толкование сна — и всё это объяснено простыми словами.</p>

      <section className="prose mt-8">
        <h2>Что такое «Карта дня»</h2>
        <p>«{SITE.name}» — эзотерический портал для тех, кому интересны Таро, астрология, нумерология, руны и сны. Ежедневные материалы — карта дня, гороскоп, лунный календарь, руна дня — обновляются каждое утро и считаются от даты по московскому времени, поэтому у всех читателей в один день одна и та же картина. Справочные разделы собирают значения карт, знаков, чисел, рун и камней в одном месте, с перекрёстными ссылками между ними.</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Разделы</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_KEYS.map((k) => (
            <li key={k}>
              <Link href={`/${k}`} className="card card-hover block h-full p-4">
                <span className="inline-flex items-center gap-2 font-semibold"><Icon name={SECTIONS[k].icon} size={18} className="text-accent" aria-hidden="true" /> {SECTIONS[k].title}</span>
                <span className="block text-sm text-muted mt-1">{SECTIONS[k].description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Инструменты</h2>
        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="inline-block py-1.5 underline underline-offset-4">{t.title}</Link>
              <span className="text-sm text-muted"> — {t.text.charAt(0).toLowerCase() + t.text.slice(1)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="prose mt-10">
        <h2>Как мы считаем</h2>
        <p>Гороскоп начинается с астрономии: положения Солнца, Луны и планет на полдень по Москве, солярные дома для каждого знака, аспекты между планетами и фаза Луны. Из этих фактов складывается текст, а под прогнозом указан момент расчёта. Подробно методика описана на странице <Link href="/astrologiya/kak-my-schitaem">«Как мы считаем гороскоп»</Link>. Нумерологические калькуляторы считают по дате рождения и буквам имени, а на каждой странице инструмента объяснено, откуда берётся число.</p>

        <h2>Редакционные принципы</h2>
      </section>
      <ul className="grid gap-4 sm:grid-cols-2 mt-4">
        {PRINCIPLES.map((p) => (
          <li key={p.title} className="card p-4">
            <h3 className="font-semibold">{p.title}</h3>
            <p className="text-sm text-muted mt-1">{p.text}</p>
          </li>
        ))}
      </ul>

      <section className="prose mt-8">
        <h2>Как пишутся и проверяются тексты</h2>
        <p>Значения карт, рун, чисел и символов снов опираются на устоявшиеся трактовки: для Таро — колода Райдера–Уэйта, для рун — Старший Футарк. Каждый материал проходит редактуру: сверяем даты и факты неба с расчётом, убираем повторы, категоричные и тревожные формулировки. Статьи обновляются, когда появляются новые вопросы читателей или уточняются данные. Если вы заметили ошибку или неточность, напишите нам — исправим.</p>
      </section>

      {authors.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl mb-3">Авторы</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {authors.map((a) => (
              <li key={a.slug} className="card p-4">
                <Link href={`/avtory/${a.slug}`} className="font-semibold underline underline-offset-4">{a.name}</Link>
                <span className="text-muted">, {a.role}</span>
                <p className="text-sm text-muted mt-1">{a.short}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="prose mt-10">
        <h2>Контакты</h2>
        <p>Вопросы, предложения и сообщения об ошибках — на почту <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Там же отвечаем по заказам и возвратам; условия — в <Link href="/oferta">оферте</Link> и на странице <Link href="/vozvrat">о возврате</Link>.</p>
        <p>Новые материалы, карта дня и короткие ролики выходят в наших каналах:</p>
      </section>
      <ul className="mt-3 flex flex-wrap gap-2">
        {socials.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="me noopener" className="btn btn-ghost">{s.title}</a>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted mt-10 max-w-2xl">Материалы сайта носят развлекательный и познавательный характер и не заменяют консультацию специалистов.</p>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "@id": `${SITE.url}${PATH}`,
          url: `${SITE.url}${PATH}`,
          name: TITLE,
          description: DESCRIPTION,
          inLanguage: "ru",
          isPartOf: { "@id": `${SITE.url}/#website` },
          about: { "@id": ORG_ID },
          mainEntity: { ...orgJsonLd(true), ...(authors.length ? { member: authors.map((a) => authorJsonLd(a)) } : {}) },
        }}
      />
    </div>
  );
}
