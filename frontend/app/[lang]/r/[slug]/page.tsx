import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MenuOrder } from "@/components/menu-order";
import { ApiError, getMenu, getRestaurant } from "@/lib/api";
import { dictionaries, hasLocale } from "@/lib/i18n";

async function load(slug: string) {
  try {
    return await Promise.all([getRestaurant(slug), getMenu(slug)]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
}

export async function generateMetadata({ params }: PageProps<"/[lang]/r/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [restaurant] = await load(slug);
  return { title: restaurant.name };
}

export default async function MenuPage({ params, searchParams }: PageProps<"/[lang]/r/[slug]">) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const { table } = await searchParams;
  const [restaurant, categories] = await load(slug);

  return (
    <MenuOrder
      restaurant={restaurant}
      categories={categories}
      lang={lang}
      t={dictionaries[lang]}
      initialTable={typeof table === "string" ? table : undefined}
    />
  );
}
