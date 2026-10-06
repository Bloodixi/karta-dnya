import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import Faq from "@/components/Faq";
import { DIGITS, getClockNumbers } from "@/lib/clock";

export const metadata: Metadata = {
  title: "Значение чисел на часах: одинаковые и зеркальные цифры",
  description: "Что значат одинаковые и зеркальные числа на часах: 11:11, 22:22, 12:12, 00:00, 21:21 и ещё 30 сочетаний. Значение каждой цифры, любовь, деньги и совет.",
  alternates: { canonical: "/numerologiya/chisla-na-chasah" },
};

const FAQ = [
  { q: "Почему я постоянно вижу одинаковые цифры на часах?", a: "Чаще всего это избирательное внимание: мозг отмечает редкие совпадения и забывает остальные взгляды на часы. В ангельской нумерологии такие моменты принято читать как подсказку обратить внимание на тему цифры." },
  { q: "Чем отличаются одинаковые числа от зеркальных?", a: "Одинаковые (11:11, 20:20) усиливают одну тему. Зеркальные (12:21, 13:31) читаются как отражение: что отдаёте, то и возвращается, и важно, что вы делаете первым шагом." },
  { q: "Нужно ли загадывать желание на 11:11?", a: "Это милая традиция, а не правило. Полезнее сформулировать намерение одним ясным предложением и сделать маленький шаг к нему в тот же день." },
  { q: "Считаются ли цифры на телефоне, а не на настенных часах?", a: "Да, источник не важен. Важен момент, когда вы случайно заметили время, а не искали его специально." },
];

export default function ClockHubPage() {
  const all = getClockNumbers();
  const doubles = all.filter((c) => c.kind === "double");
  const mirrors = all.filter((c) => c.kind === "mirror");
  const Grid = ({ items }: { items: typeof all }) => (
    <div className="grid-lines grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6">
      {items.map((c) => (
        <Link key={c.slug} href={`/numerologiya/chisla-na-chasah/${c.slug}`} className="p-4 text-center hover:bg-surface transition-colors">
          <span className="display text-2xl block">{c.time}</span>
          <span className="text-xs text-muted">{c.title}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/numerologiya", label: "Нумерология" }, { href: "/numerologiya/chisla-na-chasah", label: "Числа на часах" }]} />
      <h1 className="text-3xl md:text-4xl">Значение чисел на часах</h1>
      <p className="text-muted mt-3 max-w-2xl text-lg">Случайно взглянули на часы и увидели 11:11 или 12:21? Ниже все одинаковые и зеркальные сочетания с толкованием: общее значение, любовь, деньги и совет на день.</p>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Одинаковые числа</h2><span className="mono">{doubles.length} сочетаний</span></div>
        {doubles.length ? <Grid items={doubles} /> : <p className="text-muted">Толкования готовятся.</p>}
      </section>
      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Зеркальные числа</h2><span className="mono">{mirrors.length} сочетаний</span></div>
        {mirrors.length ? <Grid items={mirrors} /> : <p className="text-muted">Толкования готовятся.</p>}
      </section>

      <section className="prose mt-12">
        <h2>Как читать числа на часах</h2>
        <p>Традиция «ангельской нумерологии» опирается на значения цифр от 0 до 9. Одинаковые цифры усиливают одну тему, зеркальные говорят об отражении и обратной связи, а сумма всех цифр даёт итоговое число момента. Это не предсказание, а повод остановиться на секунду и спросить себя: о чём я сейчас думал?</p>
        <p>Полезно связать подсказку часов с датой рождения: <Link href="/chislo-sudby">число судьбы</Link> показывает ваш фон, а <Link href="/kvadrat-pifagora">квадрат Пифагора</Link> раскладывает характер по цифрам.</p>
      </section>

      <section className="mt-10">
        <div className="ornament mb-4"><h2 className="text-2xl">Значение цифр</h2><span className="mono">от 0 до 9</span></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(DIGITS).map(([d, v]) => (
            <div key={d} className="card p-4">
              <p className="display text-3xl">{d} <span className="text-base text-muted">· {v.title}</span></p>
              <p className="text-sm text-muted mt-2">{v.text}</p>
            </div>
          ))}
        </div>
      </section>
      <Faq items={FAQ} />
    </div>
  );
}
