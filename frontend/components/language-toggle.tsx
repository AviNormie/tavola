"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

// The language lives in the URL (/en/..., /it/...). The cookie only lets unprefixed links like /r/slug
// (what a table QR code carries) open in the language the guest last picked.
export function LanguageToggle({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/(en|it)/, "");

  return (
    <nav aria-label={label} className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
      {locales.map((code) => (
        <Link
          key={code}
          href={`/${code}${rest}`}
          hrefLang={code}
          lang={code}
          aria-current={code === lang ? "true" : undefined}
          onClick={() => {
            document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={`flex min-h-9 min-w-10 items-center justify-center rounded-md px-2.5 font-medium uppercase ${
            code === lang ? "bg-ink text-paper" : "text-muted hover:text-ink"
          }`}
        >
          {code}
        </Link>
      ))}
    </nav>
  );
}
