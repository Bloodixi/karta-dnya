import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import StoneDateForm from "@/components/StoneDateForm";
import ZodiacSign from "@/components/ZodiacSign";
import { getNumerology, getStoneImages, type Stone } from "@/lib/content";
import { destinyNumber } from "@/lib/numerology";
import { pageTitle } from "@/lib/site";
import { baseNumber, NUMBER_NOTES, parseDateParam, signByDate, stonesForNumber, stonesForSign } from "@/lib/stones";

const PATH = "/kamni/po-date-rozhdeniya";

export const metadata: Metadata = {
  title: pageTitle("Камень по дате рождения: по знаку зодиака и числу судьбы"),
  description: "Подберите камень по дате рождения: калькулятор определит знак зодиака и число судьбы и покажет подходящие минералы с фото, описанием и советами, как носить талисман.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Как подбирают камень по дате рождения?", a: "Дата даёт два ориентира: знак зодиака (по дню и месяцу) и число судьбы (сумма всех цифр даты, свёрнутая до одной). У каждого знака и числа есть свои камни; пересечение двух списков — самый точный выбор, а если пересечения нет, подойдёт любой камень из обоих." },
  { q: "Что такое число судьбы и как оно считается?", a: "Это сумма всех цифр даты рождения, которую складывают до одной цифры: например, 14.03.1990 → 1+4+0+3+1+9+9+0 = 27 → 2+7 = 9. Числа 11, 22 и 33 считаются мастер-числами; для подбора камня их сводят к 2, 4 и 6." },
  { q: "Что делать, если камень знака и камень числа не совпадают?", a: "Это обычная ситуация. Выберите тот, который больше нравится, или носите два камня по очереди: камень знака — в повседневности, камень числа — когда работаете над качеством, которое оно описывает." },
  { q: "Можно ли подобрать камень ребёнку или в подарок?", a: "Да, по той же дате рождения. Для подарка лучше выбирать прочные камни без острых граней — агат, нефрит, авантюрин, яшму; хрупкие минералы вроде селенита или кунцита требуют аккуратного обращения." },
];

function StoneCards({ stones, images }: { stones: Stone[]; images: ReturnType<typeof getStoneImages> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {stones.map((s) => (
        <Link key={s.slug} href={`/kamni/${s.slug}`} className="card card-hover overflow-hidden flex flex-col">
          {images[s.slug] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[s.slug].thumb} width={400} height={300} alt={`${s.name}: фото`} loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover" />
          )}
          <span className="p-4 flex flex-col">
            <p className="font-semibold">{s.name}</p>
            <p className="text-xs text-muted">{s.color}</p>
            <p className="text-sm text-muted mt-2 line-clamp-2">{s.properties.join(", ")}</p>
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function StoneByDatePage({ searchParams }: PageProps<"/kamni/po-date-rozhdeniya">) {
  const { d } = await searchParams;
  const date = parseDateParam(d);
  const invalid = d !== undefined && !date;
  const images = getStoneImages();
  const numerology = getNumerology();

  const sign = date ? signByDate(date.month, date.day) : null;
  const destiny = date ? destinyNumber(date.day, date.month, date.year) : null;
  const base = destiny ? baseNumber(destiny.number) : null;
  const signStones = sign ? stonesForSign(sign.slug) : [];
  const numberStones = base ? stonesForNumber(base) : [];
  const both = signStones.filter((s) => numberStones.some((n) => n.slug === s.slug));
  const numberInfo = destiny ? numerology.find((n) => n.number === destiny.number) : null;
  const human = date ? new Date(Date.UTC(date.year, date.month - 1, date.day)).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/kamni", label: "Камни" }, { href: PATH, label: "По дате рождения" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Камень по дате рождения</h1>
      <p className="text-muted mt-2 max-w-2xl text-lg">
        Введите дату рождения: калькулятор определит знак зодиака и число судьбы и покажет камни, которые традиция связывает с каждым из них.
        Результат можно сохранить или отправить ссылкой.
      </p>
      <div className="mt-6 max-w-2xl">
        <StoneDateForm initial={date?.key ?? ""} />
        {invalid && <p className="text-sm mt-3 text-red-600">Не удалось разобрать дату. Укажите её в формате ГГГГ-ММ-ДД, например 1990-03-14.</p>}
      </div>

      {date && sign && destiny && base && (
        <section className="mt-10" aria-labelledby="result">
          <h2 id="result" className="text-2xl">Результат для {human}</h2>

          <div className="card p-5 mt-4">
            <div className="flex items-center gap-4">
              <ZodiacSign symbol={sign.symbol} element={sign.element} slug={`date-${sign.slug}`} size={64} className="shrink-0" />
              <div>
                <p className="text-xs text-muted uppercase tracking-wide">Знак зодиака</p>
                <p className="text-2xl font-semibold">{sign.name}</p>
                <p className="text-sm text-muted">{sign.dates} · {sign.element} · {sign.planet} · традиционный камень: {sign.stone}</p>
              </div>
            </div>
            <h3 className="mt-5 font-semibold">Камни знака {sign.name}</h3>
            <div className="mt-3"><StoneCards stones={signStones.slice(0, 6)} images={images} /></div>
            <p className="mt-4 text-sm">
              <Link href={`/kamni/po-znaku-zodiaka/${sign.slug}`} className="text-accent underline">Все камни для знака {sign.name}: почему подходят и как носить →</Link>
            </p>
          </div>

          <div className="card p-5 mt-4">
            <p className="text-xs text-muted uppercase tracking-wide">Число судьбы</p>
            <p className="display text-4xl mt-1">
              {destiny.number}
              {numberInfo && <span className="text-xl text-muted"> · {numberInfo.title}</span>}
            </p>
            <p className="text-sm text-muted mt-1">Расчёт: {destiny.steps.join(" → ")}</p>
            {destiny.number !== base && (
              <p className="text-sm text-muted mt-1">{destiny.number} — мастер-число; для подбора камня оно сводится к {base}.</p>
            )}
            <p className="mt-3 max-w-2xl">Число {base}: {NUMBER_NOTES[base]}.</p>
            <h3 className="mt-5 font-semibold">Камни числа {base}</h3>
            <div className="mt-3"><StoneCards stones={numberStones} images={images} /></div>
            <p className="mt-4 text-sm">
              <Link href="/chislo-sudby" className="text-accent underline">Подробнее о числе судьбы {destiny.number} →</Link>
            </p>
          </div>

          <div className="card p-5 mt-4">
            <h3 className="font-semibold">Что выбрать</h3>
            {both.length > 0 ? (
              <p className="mt-2 max-w-2xl">
                Камни, которые подходят и знаку {sign.name}, и числу {base}: {both.map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`} className="text-accent underline">{s.name.toLowerCase()}</Link></span>)}.
                С такого пересечения удобнее всего начинать.
              </p>
            ) : (
              <p className="mt-2 max-w-2xl">
                Списки знака и числа не пересекаются, и это нормально. Камень знака подойдёт для повседневности, а камень числа — для периодов, когда хочется развить качество,
                которое оно описывает. Выбирайте тот, что нравится больше.
              </p>
            )}
          </div>
        </section>
      )}

      <section className="prose mt-12">
        <h2>Как работает подбор</h2>
        <ol>
          <li><strong>Знак зодиака</strong> определяется по дню и месяцу рождения. У каждого знака есть стихия и планета-управитель, а значит, и свой круг камней: яркие для Огня, спокойные для Земли, лёгкие для Воздуха, мягкие для Воды.</li>
          <li><strong>Число судьбы</strong> считается из всех цифр даты: их складывают до одной цифры. Оно описывает склад характера, и ему тоже подбирают камни — по качеству, которое число усиливает.</li>
          <li><strong>Пересечение</strong> двух списков — самый точный выбор. Если его нет, подойдёт любой камень из обоих: важнее, чтобы он нравился.</li>
        </ol>
        <p>
          Все соответствия здесь — часть эзотерической традиции, а не наука. Камень не решает за вас и не меняет обстоятельств, но может стать
          приятным напоминанием о выбранном качестве. Подробнее о том, как выбирать и очищать камни, — в <Link href="/kamni">каталоге камней</Link> и
          статье <Link href="/kamni/kak-ochistit-kamni">как очистить камни</Link>.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl mb-3">Камни по числу судьбы: таблица 1–9</h2>
        <div className="prose overflow-x-auto" style={{ maxWidth: "none" }}>
          <table style={{ display: "table" }}>
            <thead><tr><th>Число</th><th>О чём оно</th><th>Камни</th></tr></thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <tr key={n}>
                  <td className="font-semibold">{n}</td>
                  <td>{NUMBER_NOTES[n]}</td>
                  <td>{stonesForNumber(n).map((s, i) => <span key={s.slug}>{i > 0 && ", "}<Link href={`/kamni/${s.slug}`}>{s.name.toLowerCase()}</Link></span>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted mt-2">Мастер-числа 11, 22 и 33 для подбора камня сводятся к 2, 4 и 6.</p>
      </section>

      <Faq items={FAQ} />

      <p className="mt-10 text-muted">
        Смотрите также: <Link className="text-accent underline" href="/kamni/po-znaku-zodiaka">камни по знаку зодиака</Link>,{" "}
        <Link className="text-accent underline" href="/chislo-sudby">калькулятор числа судьбы</Link>,{" "}
        <Link className="text-accent underline" href="/goroskop">гороскоп на сегодня</Link>.
      </p>
    </div>
  );
}
