import Link from "next/link";

/** Блок перелинковки внутри раздела «Матрица судьбы» и на смежные инструменты. */
export default function MatrixNav({ current }: { current: string }) {
  const items = [
    { href: "/matrica-sudby", title: "Калькулятор матрицы судьбы", text: "Рассчитать арканы по дате рождения" },
    { href: "/matrica-sudby/sovmestimost", title: "Совместимость по матрице", text: "Арканы пары и общая энергия союза" },
    { href: "/matrica-sudby/arkany", title: "Значения 22 арканов", text: "Энергия, плюсы, минусы, отношения, работа" },
    { href: "/numerologiya/po-date-rozhdeniya", title: "Нумерология по дате рождения", text: "Число судьбы, имени и личный год" },
    { href: "/taro/karty", title: "Значения карт Таро", text: "Старшие арканы в колоде Райдера–Уэйта" },
    { href: "/kvadrat-pifagora", title: "Квадрат Пифагора", text: "Психоматрица по дате рождения" },
  ].filter((t) => t.href !== current);
  return (
    <section className="mt-12">
      <div className="ornament mb-4"><h2 className="text-2xl">Что ещё посмотреть</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Link key={t.href} href={t.href} className="card card-hover p-4 block">
            <p className="display text-lg">{t.title}</p>
            <p className="text-sm text-muted mt-1">{t.text}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
