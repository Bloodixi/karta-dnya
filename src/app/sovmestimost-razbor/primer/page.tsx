import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { RazborStickyCta } from "@/components/RazborClient";
import RazborView from "@/components/RazborView";
import { COMPAT, COMPAT_TOC } from "@/lib/razborCompat";
import { sampleDoc } from "@/lib/razborSamples";
import { countWords } from "@/lib/ruCount";
import { pageTitle } from "@/lib/site";

const PATH = "/sovmestimost-razbor/primer";
const TITLE = "Пример совместимости пары по датам рождения";
const DESCRIPTION = `Как выглядит полная совместимость пары: все ${countWords(COMPAT_TOC.length, ["раздел", "раздела", "разделов"])} на примере вымышленных дат 08.06.1990 и 14.11.1987 — числа, образ пары, любовь, быт и общий год.`;

export const metadata: Metadata = {
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  robots: { index: true, follow: true },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

/** Общий год считается от текущего года по Москве — пересобираем страницу раз в сутки. */
export const revalidate = 86400;

export default function CompatSamplePage() {
  const doc = sampleDoc("compat");

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { href: "/numerologiya", label: "Нумерология" },
          { href: "/sovmestimost-razbor", label: "Совместимость пары" },
          { href: PATH, label: "Пример" },
        ]}
      />
      <header className="max-w-3xl">
        <h1 className="text-3xl md:text-4xl">{TITLE}</h1>
        <p className="text-lg mt-3">
          {doc.who} · даты рождения {doc.date}
        </p>
        <div className="card frame-gold p-5 mt-6">
          <p className="mono">Это пример</p>
          <p className="mt-2">
            Так выглядит полная совместимость. Мария и Андрей — вымышленная пара, а текст собран по тем же правилам, что и ваш: по двум датам рождения и текущему году. Полная совместимость для своей пары стоит {COMPAT.price} ₽.
          </p>
          <p className="mt-4">
            <Link href="/sovmestimost-razbor#forma" className="btn">
              Посчитать для своей пары
            </Link>
          </p>
        </div>
      </header>

      <div id="primer-body" className="mt-8">
        <RazborView sections={doc.sections} />
      </div>
      <RazborStickyCta price={COMPAT.price} from="primer-body" to="primer-end" label="Хочу такую же" />

      <footer id="primer-end" className="mt-12 max-w-3xl border-t border-line pt-6 scroll-mt-24">
        <p className="display text-2xl">Хотите такой же текст о своей паре?</p>
        <p className="text-muted mt-2">Бесплатная часть откроется сразу, без регистрации. Полный текст — {COMPAT.price} ₽.</p>
        <p className="mt-4">
          <Link href="/sovmestimost-razbor#forma" className="btn">
            Посчитать для своей пары
          </Link>
        </p>
        <p className="text-sm text-muted mt-6">
          Есть и другие примеры: <Link href="/razbor/primer" className="text-accent-text underline">личный разбор</Link> и{" "}
          <Link href="/razbor-rebenka/primer" className="text-accent-text underline">детский разбор</Link>.
        </p>
        <p className="text-sm text-muted mt-4">Совместимость носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за вами.</p>
      </footer>
    </article>
  );
}
