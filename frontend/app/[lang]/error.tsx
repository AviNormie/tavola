"use client";

import { useParams } from "next/navigation";
import { dictionaries, hasLocale } from "@/lib/i18n";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const t = dictionaries[hasLocale(lang) ? lang : "en"].error;

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="font-display text-3xl font-semibold">{t.title}</h1>
      <p className="mt-3 text-muted">{t.text}</p>
      <button type="button" onClick={reset} className="btn-primary mt-8">{t.retry}</button>
    </div>
  );
}
