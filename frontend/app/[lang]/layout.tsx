import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { dictionaries, hasLocale, locales } from "@/lib/i18n";
import "../globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    title: { default: "Tavola", template: "%s · Tavola" },
    description: dictionaries[lang].home.metaDescription,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = dictionaries[lang];

  return (
    <html lang={lang} className={`${geist.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          {t.nav.skip}
        </a>
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href={`/${lang}`} className="flex items-baseline gap-3">
              <span className="font-display text-2xl font-semibold tracking-tight">Tavola</span>
              <span className="hidden text-sm text-muted sm:inline">{t.brandTagline}</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/${lang}#demo`} className="hidden min-h-11 items-center text-sm font-medium text-muted hover:text-ink sm:flex">
                {t.nav.demo}
              </Link>
              <Suspense fallback={<div className="h-10 w-24" />}>
                <LanguageToggle lang={lang} label={t.nav.language} />
              </Suspense>
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-line">
          <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted sm:px-6">{t.footer}</p>
        </footer>
      </body>
    </html>
  );
}
