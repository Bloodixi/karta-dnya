/** Раздел «Подробнее» под интерактивом: HTML из Markdown (remark-html с sanitize), см. src/lib/extra-text.ts. */
export default function ExtraText({ html, id = "podrobnee", className = "" }: { html: string; id?: string; className?: string }) {
  return <section id={id} className={`prose mt-12 scroll-mt-24 ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
