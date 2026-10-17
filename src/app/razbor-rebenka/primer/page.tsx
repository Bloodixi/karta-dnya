import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { RazborStickyCta } from "@/components/RazborClient";
import RazborView from "@/components/RazborView";
import { CHILD, CHILD_TOC } from "@/lib/razborChild";
import { sampleDoc } from "@/lib/razborSamples";
import { countWords } from "@/lib/ruCount";
import { pageTitle } from "@/lib/site";

const PATH = "/razbor-rebenka/primer";
const TITLE = "Пример детского разбора по дате рождения";
const DESCRIPTION = `Как выглядит детский разбор для родителя: все ${countWords(CHILD_TOC.length, ["раздел", "раздела", "разделов"])} на примере вымышленной даты 12.04.2018 — характер, как поддержать, квадрат Пифагора и советы.`;

export const metadata: Metadata = {
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

/** Возраст ребёнка считается на текущий месяц по Москве — пересобираем страницу раз в сутки. */
export const revalidate = 86400;

export default function ChildSamplePage() {
  const doc = sampleDoc("child");

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: "/numerologiya", label: "Нумерология" },
          { href: "/razbor-rebenka", label: "Детский разбор" },
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
            Так выглядит полный детский разбор. Миша — вымышленный ребёнок, а текст собран по тем же правилам, что и твой: по дате рождения и возрасту на текущий месяц. Полный разбор для своего ребёнка стоит {CHILD.price} ₽.
          </p>
          <p className="mt-4">
            <Link href="/razbor-rebenka#forma" className="btn">
              Посчитать для своего ребёнка
            </Link>
          </p>
        </div>
      </header>

      <div id="primer-body" className="mt-8">
        <RazborView sections={doc.sections} />
      </div>
      <RazborStickyCta price={CHILD.price} from="primer-body" to="primer-end" label="Хочу такой же" />

      <footer id="primer-end" className="mt-12 max-w-3xl border-t border-line pt-6 scroll-mt-24">
        <p className="display text-2xl">Хочешь такой же разбор для своего ребёнка?</p>
        <p className="text-muted mt-2">Бесплатная часть откроется сразу, без регистрации. Полный текст — {CHILD.price} ₽.</p>
        <p className="mt-4">
          <Link href="/razbor-rebenka#forma" className="btn">
            Посчитать для своего ребёнка
          </Link>
        </p>
        <p className="text-sm text-muted mt-6">
          Есть и другие примеры: <Link href="/razbor/primer" className="text-accent-text underline">личный разбор</Link> и{" "}
          <Link href="/sovmestimost-razbor/primer" className="text-accent-text underline">совместимость пары</Link>.
        </p>
        <p className="text-sm text-muted mt-4">Разбор носит развлекательный и ознакомительный характер и не является консультацией психолога, педагога или врача. Решения остаются за тобой.</p>
      </footer>
    </article>
  );
}
