import { dzenFeed } from "@/lib/dzen";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return new Response(await dzenFeed(), { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
