import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import RazborView from "@/components/RazborView";
import { buildRazbor, nowMsk, RAZBOR, RAZBOR_TOC, RAZBOR_VERSION } from "@/lib/razbor";
import { countWords } from "@/lib/ruCount";
import { pageTitle } from "@/lib/site";

const PATH = "/razbor/primer";
const TITLE = "Пример нумерологического разбора по дате рождения";
const DESCRIPTION =
  `Как выглядит полный нумерологический разбор: все ${countWords(RAZBOR_TOC.length, ["раздел", "раздела", "разделов"])} на примере вымышленной даты 08.06.1990 — числа, квадрат Пифагора и прогноз на год.`;

export const metadata: Metadata = {
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

/** Прогноз по месяцам идёт от текущего месяца по Москве — пересобираем страницу раз в сутки. */
export const revalidate = 86400;

/** Вымышленный человек для примера. */
const SAMPLE = { d: 8, m: 6, y: 1990, name: "Мария" };

export default function RazborSamplePage() {
  const doc = buildRazbor({ ...SAMPLE, ...nowMsk(), v: RAZBOR_VERSION });

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: "/numerologiya", label: "Нумерология" },
          { href: "/razbor", label: "Разбор по дате рождения" },
          { href: PATH, label: "Пример" },
        ]}
      />
      <header className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl">{TITLE}</h1>
        <p className="text-lg mt-3">
          {doc.who} · дата рождения {doc.date}
        </p>
        <div className="card frame-gold p-5 mt-6">
          <p className="mono">Это пример</p>
          <p className="mt-2">
            Так выглядит полный разбор. Мария — вымышленный человек, а текст собран по тем же правилам, что и твой: по дате рождения и текущему месяцу. Полный разбор по своей дате стоит {RAZBOR.price} ₽.
          </p>
          <p className="mt-4">
            <Link href="/razbor#forma" className="btn">
              Посчитать по своей дате
            </Link>
          </p>
        </div>
      </header>

      <div className="mt-8">
        <RazborView sections={doc.sections} />
      </div>

      <footer className="mt-12 max-w-3xl border-t border-line pt-6">
        <p className="display text-2xl">Хочешь такой же разбор по своей дате?</p>
        <p className="text-muted mt-2">Бесплатная часть откроется сразу, без регистрации. Полный текст — {RAZBOR.price} ₽.</p>
        <p className="mt-4">
          <Link href="/razbor#forma" className="btn">
            Посчитать по своей дате
          </Link>
        </p>
        <p className="text-sm text-muted mt-6">Разбор носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за тобой.</p>
      </footer>
    </article>
  );
}
