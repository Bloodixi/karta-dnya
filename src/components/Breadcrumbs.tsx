import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "./JsonLd";

export type Crumb = { href: string; label: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: "/", label: "Главная" }, ...items];
  return (
    <nav aria-label="Хлебные крошки" className="text-sm text-muted mb-2 md:mb-4">
      <ol className="flex flex-wrap items-center gap-x-1">
        {all.map((c, i) => {
          const last = i === all.length - 1;
          // Длинная последняя крошка повторяет H1 под ней — на телефоне её не показываем.
          const hideOnPhone = last && i > 1 && c.label.length > 28;
          return (
            // Разделитель «›» стоит перед пунктом и переносится вместе с ним — не висит в конце строки.
            <li key={c.href} className={`${hideOnPhone ? "hidden sm:flex" : "flex"} min-w-0 items-center gap-1`}>
              {i > 0 && <span aria-hidden="true">›</span>}
              {last ? (
                <span className="text-ink" aria-current="page">{c.label}</span>
              ) : (
                <Link href={c.href} className="inline-flex items-center min-h-10 md:min-h-0 hover:text-ink">
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: SITE.url + c.href })),
        }}
      />
    </nav>
  );
}
