import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import DestinyCalc from "@/components/DestinyCalc";
import NumerologyNav from "@/components/NumerologyNav";
import { getArticles, getNumerology } from "@/lib/content";

export const metadata: Metadata = {
  title: "Число судьбы по дате рождения: калькулятор и значение",
  description: "Рассчитайте число судьбы по дате рождения онлайн за секунду и узнайте его значение: характер, любовь, работа, мастер-числа 11, 22 и 33.",
  alternates: { canonical: "/chislo-sudby" },
};

export default function DestinyPage() {
  const numbers = getNumerology();
  const articles = getArticles("numerologiya").slice(0, 3);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ href: "/chislo-sudby", label: "Число судьбы" }]} />
      <h1 className="text-3xl md:text-4xl font-semibold">Число судьбы по дате рождения</h1>
      <p className="text-muted mt-2 max-w-2xl">Сложите все цифры даты рождения до одной цифры, кроме мастер-чисел 11, 22 и 33. Калькулятор сделает это за вас и покажет значение. Нужны сразу все числа даты и имени — откройте <Link className="text-accent underline" href="/numerologiya/po-date-rozhdeniya">нумерологию по дате рождения</Link>, а для разбора через 22 аркана — <Link className="text-accent underline" href="/matrica-sudby">матрицу судьбы</Link>.</p>
      <div className="mt-6 max-w-2xl">
        <DestinyCalc numbers={numbers} />
      </div>
      {numbers.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl mb-3">Значения чисел</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {numbers.map((n) => (
              <Link key={n.number} href={`/chislo-sudby/${n.number}`} className="card card-hover p-5 block">
                <p className="display text-3xl">{n.number} <span className="text-lg text-muted">· {n.title}</span></p>
                <p className="text-sm text-muted mt-2 line-clamp-4">{n.description}</p>
                <p className="text-accent text-sm mt-3">Подробнее о числе {n.number}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      {articles.length > 0 && (
        <p className="mt-10 text-muted">
          Подробнее: {articles.map((a, i) => <span key={a.slug}>{i > 0 && ", "}<Link className="text-accent underline" href={`/numerologiya/${a.slug}`}>{a.title}</Link></span>)}.
        </p>
      )}
      <NumerologyNav current="/chislo-sudby" />
    </div>
  );
}
