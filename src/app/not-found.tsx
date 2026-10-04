import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20 text-center">
      <p className="text-5xl">🔮</p>
      <h1 className="text-3xl font-semibold mt-4">Такой страницы нет</h1>
      <p className="text-muted mt-2">Карты молчат. Попробуйте начать с главной или вытянуть карту дня.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn">На главную</Link>
        <Link href="/karta-dnya" className="btn btn-ghost">Карта дня</Link>
      </div>
    </div>
  );
}
