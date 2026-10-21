import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import sharp from "sharp"; // приходит вместе с next (оптимизация картинок)
import { getArticles } from "@/lib/content";

/** Обложка статьи в JPEG для ленты Дзена (webp он не принимает); собирается при build. */
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().filter((a) => a.cover).map((a) => ({ file: `${a.slug}.jpg` }));
}

export async function GET(_req: Request, { params }: RouteContext<"/rss/dzen/[file]">) {
  const { file } = await params;
  const a = getArticles().find((x) => x.cover && `${x.slug}.jpg` === file);
  if (!a?.cover) notFound();
  const src = await fs.readFile(path.join(process.cwd(), "public", a.cover.file));
  const jpg = await sharp(src).flatten({ background: "#ffffff" }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  return new Response(new Uint8Array(jpg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400" } });
}
