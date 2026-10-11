import Link from "next/link";
import { notFound } from "next/navigation";
import { KitchenIcon, MenuIcon, TableIcon } from "@/components/icons";
import { StatusBadge } from "@/components/status-badge";
import { DEMO_RESTAURANTS } from "@/lib/demo";
import { dictionaries, hasLocale } from "@/lib/i18n";

const featureIcons = [MenuIcon, TableIcon, KitchenIcon];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = dictionaries[lang];

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-terracotta-deep">{t.home.eyebrow}</p>
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">{t.home.title}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{t.home.subtitle}</p>
          <Link href="#demo" className="btn-primary mt-8 px-6">
            {t.home.cta}
          </Link>
        </div>

        {/* Decorative order ticket; the real flow is in the demo below. */}
        <div aria-hidden="true" className="mx-auto w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-sm md:rotate-1">
          <div className="flex items-center justify-between border-b border-dashed border-line pb-4">
            <span className="font-display text-xl font-semibold">{t.home.mockOrder}</span>
            <span className="rounded-md bg-sand px-2 py-1 text-sm font-medium">{t.home.mockTable}</span>
          </div>
          <ul className="space-y-3 py-4 text-sm">
            <li className="flex justify-between"><span>2× Spaghetti cacio e pepe</span><span className="text-muted">€26.00</span></li>
            <li className="flex justify-between"><span>1× Tiramisù</span><span className="text-muted">€7.00</span></li>
            <li className="flex justify-between"><span>2× Espresso</span><span className="text-muted">€4.00</span></li>
          </ul>
          <div className="flex items-center justify-between border-t border-dashed border-line pt-4">
            <StatusBadge status="preparing" label={t.status.preparing} />
            <span className="font-semibold">€37.00</span>
          </div>
        </div>
      </section>

      <section id="demo" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight">{t.home.demoTitle}</h2>
          <p className="mt-3 max-w-2xl text-muted">{t.home.demoText}</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {DEMO_RESTAURANTS.map((r) => (
              <li key={r.slug} className="rounded-xl border border-line bg-paper p-6">
                <h3 className="font-display text-2xl font-semibold">{r.name}</h3>
                <p className="mt-1 text-sm text-muted">{r.blurb[lang]}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/${lang}/r/${r.slug}`} className="btn-primary">{t.home.guestMenu}</Link>
                  <Link href={`/${lang}/dashboard/${r.slug}`} className="btn-ghost">{t.home.kitchen}</Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">{t.home.featuresTitle}</h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3">
          {t.home.features.map((f, i) => {
            const Icon = featureIcons[i];
            return (
              <li key={f.title}>
                <span className="flex size-11 items-center justify-center rounded-lg bg-sage-soft text-sage-deep"><Icon /></span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-line bg-sage-soft">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <p className="font-medium text-sage-deep">{t.home.tech}</p>
          <p className="mt-1 text-sm text-sage-deep/90">{t.home.techText}</p>
        </div>
      </section>
    </>
  );
}
