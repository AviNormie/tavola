import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { ApiError, getRestaurant } from "@/lib/api";
import { dictionaries, hasLocale } from "@/lib/i18n";

async function load(slug: string) {
  try {
    return await getRestaurant(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: PageProps<"/[lang]/dashboard/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  return { title: `${dictionaries[lang].dashboard.title} · ${(await load(slug)).name}` };
}

export default async function DashboardPage({ params }: PageProps<"/[lang]/dashboard/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  return <Dashboard restaurant={await load(slug)} lang={lang} t={dictionaries[lang]} />;
}
