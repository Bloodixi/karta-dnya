import type { Metadata } from "next";
import Link from "next/link";
import AffirmationOfDay from "@/components/AffirmationOfDay";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { AFFIRM_PATH, getAffirmationTopics } from "@/lib/affirmations";
import { pageTitle, SITE } from "@/lib/site";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: pageTitle("Аффирмации: что это и 180 готовых фраз на каждый день"),
  description: "Аффирмации на каждый день: что это, как повторять, готовые подборки на деньги, здоровье, любовь, успех, для женщин и утренние, плюс аффирмация дня.",
  alternates: { canonical: AFFIRM_PATH },
};

const FAQ = [
  { q: "Что такое аффирмации простыми словами?", a: "Это короткие позитивные фразы от первого лица, которые вы повторяете регулярно, чтобы мягко менять внутренний диалог и настрой. Это практика настроя: она не обещает чудес, а помогает держать внимание на том, что для вас важно." },
  { q: "Как правильно повторять аффирмации?", a: "Говорите фразу медленно, в настоящем времени и от первого лица, лучше вслух или про себя с глубоким дыханием. Хватит двух-трёх минут утром или вечером. Регулярность и искренность важнее количества повторов." },
  { q: "Работают ли аффирмации?", a: "Они не меняют обстоятельства сами по себе, но помогают спокойнее относиться к себе, меньше критиковать себя и последовательнее действовать. Относитесь к ним как к поддержке, а не как к гарантии результата." },
  { q: "Что делать, если не верится в аффирмацию?", a: "Смягчите формулировку: вместо «Я уверена» скажите «Я учусь быть увереннее». Фраза должна звучать честно. Если сопротивление остаётся, выберите другую фразу или вернитесь к ней позже." },
  { q: "Когда лучше повторять аффирмации?", a: "Удобнее всего утром, пока день не начался, и вечером, перед сном. Можно также использовать их перед важным разговором или делом, чтобы собраться." },
  { q: "Могут ли аффирмации заменить лечение или финансовое планирование?", a: "Нет. Аффирмации не заменяют врача, юриста, финансовые расчёты и конкретные действия. Они дополняют заботу о себе и помогают сохранять спокойствие, пока вы решаете реальные задачи." },
];

export default function AffirmationsHub() {
  const topics = getAffirmationTopics();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/praktiki", label: "Практики" }, { href: AFFIRM_PATH, label: "Аффирмации" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Аффирмации на каждый день</h1>
      <p className="text-muted mt-2 max-w-2xl text-lg">
        Короткие фразы для спокойного настроя: подборки на деньги, здоровье, любовь, успех, для женщин и на утро, а также аффирмация на сегодня.
        Формулировки даны в женском роде; при желании замените окончания на привычные вам.
      </p>

      <section className="mt-8"><AffirmationOfDay /></section>

      <section className="prose mt-10">
        <h2>Что такое аффирмации</h2>
        <p>
          Аффирмация — это короткое утверждение от первого лица, которое вы произносите, читаете или записываете, чтобы поддержать нужный настрой.
          Это не заклинание и не способ получить желаемое по заказу, а простая практика настроя: она помогает замечать, как вы говорите с собой, и делать этот разговор добрее и яснее.
        </p>
        <h2>Как практиковать</h2>
        <ol>
          <li>Выберите одну-три фразы, которые звучат для вас честно. Лучше подборку из тем ниже, чем случайные слова из интернета.</li>
          <li>Произносите их медленно, на спокойном выдохе, утром или перед сном. Помогут три глубоких вдоха из <Link href="/praktiki/dyhatelnye-praktiki">дыхательных практик</Link>.</li>
          <li>Добавьте тишину: после фразы побудьте две-три минуты, как в <Link href="/praktiki/meditatsiya-dlya-nachinayushchih">медитации для начинающих</Link>.</li>
          <li>Подкрепляйте слова маленьким действием: аффирмация поддерживает, а результат создают шаги.</li>
        </ol>
        <p>
          Подробный разбор, как составить свои фразы и какие ошибки встречаются чаще всего, читайте в статье <Link href="/praktiki/affirmacii-na-kazhdyy-den">«Аффирмации на каждый день»</Link>.
          Начинать новую серию практик удобно в новолуние: смотрите <Link href="/lunnyy-kalendar">лунный календарь</Link> и <Link href="/praktiki/ritual-na-novolunie">ритуал на новолуние</Link>.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl mb-3">Подборки аффирмаций по темам</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => (
            <Link key={t.slug} href={`${AFFIRM_PATH}/${t.slug}`} className="card card-hover p-5 flex flex-col">
              <span className="chip self-start">{t.items.length} фраз</span>
              <p className="font-display text-xl mt-3">{t.h1}</p>
              <p className="text-sm text-muted mt-2">{t.short}</p>
              <span className="mt-auto pt-4 text-sm text-accent">Открыть подборку →</span>
            </Link>
          ))}
          <Link href={`${AFFIRM_PATH}/dnya`} className="card card-hover p-5 flex flex-col">
            <span className="chip self-start">каждый день новая</span>
            <p className="font-display text-xl mt-3">Аффирмация дня</p>
            <p className="text-sm text-muted mt-2">Одна фраза на сегодня для всех, обновляется в полночь по Москве.</p>
            <span className="mt-auto pt-4 text-sm text-accent">Прочитать на сегодня →</span>
          </Link>
        </div>
      </section>

      <Faq items={FAQ} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Подборки аффирмаций",
          itemListElement: topics.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.h1, url: `${SITE.url}${AFFIRM_PATH}/${t.slug}` })),
        }}
      />
    </div>
  );
}
