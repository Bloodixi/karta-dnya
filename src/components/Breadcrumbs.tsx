import Link from "next/link";
import { SITE } from "@/lib/site";
import JsonLd from "./JsonLd";

export type Crumb = { href: string; label: string };

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: "/", label: "Главная" }, ...items];
  return (
    <nav aria-label="Хлебные крошки" className="text-sm text-muted mb-2 md:mb-4">
      <ol className="flex flex-wrap gap-1">
        {all.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1">
            {i < all.length - 1 ? (
              <Link href={c.href} className="inline-block py-1.5 md:py-0 hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className="text-ink">{c.label}</span>
            )}
            {i < all.length - 1 && <span aria-hidden="true">›</span>}
          </li>
        ))}
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
