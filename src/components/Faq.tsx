import type { Faq as FaqItem } from "@/lib/content";
import JsonLd from "./JsonLd";

export default function Faq({ items }: { items: FaqItem[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-2xl mb-3">Частые вопросы</h2>
      <div className="grid gap-2">
        {items.map((f, i) => (
          <details key={i} className="card group">
            <summary className="cursor-pointer font-semibold list-none flex justify-between gap-3 px-4 py-3 min-h-11">
              <span>{f.q}</span>
              <span className="text-muted group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="px-4 pb-3 text-muted">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </section>
  );
}
