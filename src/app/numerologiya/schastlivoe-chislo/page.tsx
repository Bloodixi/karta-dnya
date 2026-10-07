import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import NumerologyNav from "@/components/NumerologyNav";
import { DateField, FormError, ShareLink } from "@/components/NumerologyFields";
import { getLuckyNumbers } from "@/lib/content";
import { formatDate, luckyNumbers, parseDate } from "@/lib/numerology";

const PATH = "/numerologiya/schastlivoe-chislo";

export const metadata: Metadata = {
  title: "Счастливое число по дате рождения: рассчитать онлайн",
  description: "Калькулятор счастливого числа по дате рождения: главное число удачи, ряд счастливых чисел до 99, удачные дни месяца и значение каждого числа от 1 до 9 с коротким советом.",
  alternates: { canonical: PATH },
};

const FAQ = [
  { q: "Чем счастливое число отличается от числа судьбы?", a: "Это одно и то же число, сведённое к 1–9: мастер-числа 11, 22 и 33 для счастливого числа превращаются в 2, 4 и 6. Число судьбы описывает характер, а счастливое число используют для выбора дат, номеров и мелких повседневных решений." },
  { q: "Почему в ряду несколько чисел?", a: "Счастливыми считают все числа, которые сводятся к вашему главному: для 3 это 12, 21, 30, 39 и так далее. Удобно, когда нужно выбрать номер, дату или количество." },
  { q: "Гарантирует ли счастливое число удачу?", a: "Нет. Это игровая традиция и способ прислушаться к себе, а не инструмент влияния на события. Относитесь к нему как к приятной примете." },
  { q: "Можно ли использовать счастливое число для лотереи?", a: "Выбирать по нему номера можно, но шансы от этого не меняются. Нумерология не обещает выигрышей и не советует рисковать деньгами." },
];

export default async function LuckyNumberPage({ searchParams }: PageProps<typeof PATH>) {
  const sp = await searchParams;
  const date = parseDate(sp.d);
  const invalid = sp.d !== undefined && !date;
  const texts = getLuckyNumbers();

  let result: React.ReactNode = null;
  if (date) {
    const l = luckyNumbers(date.d, date.m, date.y);
    const t = texts.find((x) => x.number === l.main);
    const tb = texts.find((x) => x.number === l.birthday);
    result = (
      <section className="mt-8" id="rezultat">
        <div className="ornament mb-4"><h2 className="text-2xl">Счастливое число для {formatDate(date)}</h2><span className="mono">по дате рождения</span></div>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="card p-6">
            <p className="mono">Главное число удачи</p>
            <p className="display text-6xl mt-1 text-accent">{l.main} {t && <span className="text-xl text-muted">· {t.title}</span>}</p>
            {t && <p className="text-sm mt-3">{t.text}</p>}
            {t && <p className="text-sm mt-2"><strong>Совет:</strong> {t.hint}</p>}
          </div>
          <div className="grid gap-4">
            <div className="card p-5">
              <p className="mono">Ряд счастливых чисел</p>
              <p className="mt-2 flex flex-wrap gap-1">{l.series.map((s) => <span key={s} className="chip">{s}</span>)}</p>
              <p className="text-xs text-muted mt-2">Все числа до 99, которые сводятся к {l.main}.</p>
            </div>
            <div className="card p-5">
              <p className="mono">Удачные дни месяца</p>
              <p className="display text-2xl mt-1">{l.days.join(", ")}</p>
            </div>
            <div className="card p-5">
              <p className="mono">Дополнительные числа</p>
              <p className="text-sm mt-2">Число дня рождения — <strong>{l.birthday}</strong>{tb ? ` (${tb.title.toLowerCase()})` : ""}; число дня и месяца — <strong>{l.monthDay}</strong>. Их используют как запасные, когда главное число не подходит.</p>
            </div>
          </div>
        </div>
        <p className="mt-4 flex flex-wrap gap-2">
          <Link href={`/chislo-sudby/${l.main}`} className="btn btn-ghost">Значение числа {l.main}</Link>
          <Link href={`/numerologiya/po-date-rozhdeniya?d=${date.iso}`} className="btn btn-ghost">Полный расчёт по дате</Link>
        </p>
        <ShareLink path={`https://karta-dnya.ru${PATH}?d=${date.iso}`} />
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: PATH, label: "Счастливое число" }]} />
      <h1 className="text-3xl md:text-4xl">Счастливое число по дате рождения</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Введите дату рождения, и калькулятор покажет ваше главное число удачи, ряд счастливых чисел до 99 и дни месяца, которые по традиции считаются благоприятными.</p>

      <div className="card p-6 mt-6 max-w-3xl">
        <Form action={PATH} className="flex flex-wrap gap-3 items-end">
          <DateField name="d" label="Дата рождения" defaultValue={date?.iso ?? (typeof sp.d === "string" ? sp.d : "")} />
          <button type="submit" className="btn">Рассчитать</button>
        </Form>
        <FormError text={invalid ? "Введите настоящую дату рождения." : undefined} />
      </div>

      {result}

      <section className="mt-12">
        <div className="ornament mb-4"><h2 className="text-2xl">Значение счастливых чисел</h2><span className="mono">от 1 до 9</span></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {texts.map((t) => (
            <div key={t.number} className="card p-5">
              <p className="display text-3xl">{t.number} <span className="text-lg text-muted">· {t.title}</span></p>
              <p className="text-sm text-muted mt-2">{t.text}</p>
              <p className="text-xs mt-2">{t.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="prose mt-12">
        <h2>Как считается счастливое число</h2>
        <p>Складываются все цифры даты рождения, затем цифры результата, пока не останется одна: 25.11.1990 → 2 + 5 + 1 + 1 + 1 + 9 + 9 + 0 = 28 → 10 → 1. Это и есть главное число удачи. В отличие от <Link href="/chislo-sudby">числа судьбы</Link>, мастер-числа здесь сводятся до основы: 11 → 2, 22 → 4, 33 → 6, потому что для выбора даты или номера нужна одна цифра.</p>
        <p>Ряд счастливых чисел — все числа до 99, которые сводятся к главному. Удачные дни месяца — те из них, что не превышают 31. Дополнительно считают число дня рождения и сумму дня с месяцем: их используют как запасные варианты. Традиция относится к числу удачи как к примете: оно помогает выбрать, когда вариантов несколько и все равны, но не меняет вероятности и не заменяет решений. Если вам интересно, что значат совпадающие цифры в течение дня, загляните на страницу <Link href="/numerologiya/chisla-na-chasah">чисел на часах</Link>.</p>
      </section>

      <Faq items={FAQ} />
      <NumerologyNav current={PATH} />
    </div>
  );
}
