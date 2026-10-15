import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import RazborView from "@/components/RazborView";
import { CopyLinkButton, PrintButton } from "@/components/RazborClient";
import { buildRazbor, RAZBOR } from "@/lib/razbor";
import { readToken } from "@/lib/razborToken";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: RAZBOR.title,
  description: "Личный нумерологический разбор по дате рождения: числа, квадрат Пифагора, личный год и прогноз на двенадцать месяцев. Страница доступна только по ссылке.",
  robots: { index: false, follow: false },
};

export default async function RazborResultPage({ params }: PageProps<"/razbor/r/[token]">) {
  const { token } = await params;
  const input = readToken(decodeURIComponent(token));
  if (!input) notFound();
  const doc = buildRazbor(input);

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <header className="max-w-3xl">
        <p className="mono">
          {SITE.name} · личный разбор
        </p>
        <h1 className="text-3xl md:text-4xl mt-2">{doc.title}</h1>
        <p className="text-lg mt-3">
          {doc.who ? <>{doc.who} · </> : null}дата рождения {doc.date}
        </p>
        <div className="no-print mt-5 flex flex-wrap gap-2">
          <PrintButton />
          <CopyLinkButton />
        </div>
        <p className="no-print text-sm text-muted mt-3">Сохрани ссылку на эту страницу — она твоя. По ней разбор откроется в любой момент и на любом устройстве.</p>
      </header>

      <div className="mt-8">
        <RazborView sections={doc.sections} />
      </div>

      <footer className="mt-12 max-w-3xl border-t border-line pt-6 text-sm text-muted">
        <p>Разбор носит развлекательный и ознакомительный характер и не является консультацией специалиста. Решения остаются за тобой.</p>
        <p className="no-print mt-3">
          <Link href="/numerologiya" className="text-accent underline">Нумерология на сайте</Link> · <Link href="/vozvrat" className="text-accent underline">Если что-то пошло не так</Link>
        </p>
      </footer>
    </article>
  );
}
