import Link from "next/link";

// not-found pages don't receive route params, so this one shows both languages.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-3xl font-semibold">We couldn&apos;t find that page</h1>
      <p lang="it" className="mt-2 text-muted">Non abbiamo trovato questa pagina</p>
      <Link href="/" className="btn-primary mt-8">Tavola</Link>
    </div>
  );
}
