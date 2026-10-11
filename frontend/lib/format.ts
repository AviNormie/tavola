import type { Locale } from "./types";

const intlLocale = (lang: Locale) => (lang === "it" ? "it-IT" : "en-GB");

export const formatMoney = (cents: number, currency: string, lang: Locale) =>
  new Intl.NumberFormat(intlLocale(lang), { style: "currency", currency }).format(cents / 100);

export const formatTime = (iso: string, lang: Locale) =>
  new Intl.DateTimeFormat(intlLocale(lang), { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function formatAgo(iso: string, lang: Locale) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return new Intl.RelativeTimeFormat(intlLocale(lang), { numeric: "auto" }).format(-minutes, "minute");
}

/** Replaces {name} placeholders: fmt("Table {n}", { n: 4 }). */
export const fmt = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
