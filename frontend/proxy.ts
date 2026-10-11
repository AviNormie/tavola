import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Sends /r/trattoria-sole (the URL a table QR code would carry) to /it/r/trattoria-sole.
// Language precedence: saved choice (cookie) > the restaurant's default > browser language > English.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (/^\/(en|it)(\/|$)/.test(pathname)) return;

  let locale: Locale | undefined;
  const saved = request.cookies.get("NEXT_LOCALE")?.value;
  if (saved && hasLocale(saved)) locale = saved;

  const slug = pathname.match(/^\/(?:r|dashboard)\/([^/]+)/)?.[1];
  if (!locale && slug) {
    const res = await fetch(`${API_URL}/api/restaurants/${slug}`, { headers: { Accept: "application/json" } }).catch(() => null);
    const defaultLocale = res?.ok ? (await res.json()).data?.default_locale : undefined;
    if (defaultLocale && hasLocale(defaultLocale)) locale = defaultLocale;
  }

  locale ??= request.headers.get("accept-language")?.toLowerCase().startsWith("it") ? "it" : "en";

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/((?!_next|api|.*\\..*).*)"] };
