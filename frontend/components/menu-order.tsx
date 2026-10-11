"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, placeOrder } from "@/lib/api";
import { fmt, formatMoney } from "@/lib/format";
import { plural, type Dictionary } from "@/lib/i18n";
import type { Locale, MenuCategory, MenuItem, Order, Restaurant } from "@/lib/types";
import { CheckIcon } from "./icons";
import { StatusBadge } from "./status-badge";

type Props = { restaurant: Restaurant; categories: MenuCategory[]; lang: Locale; t: Dictionary; initialTable?: string };

export function MenuOrder({ restaurant, categories, lang, t, initialTable }: Props) {
  const storageKey = `tavola:basket:${restaurant.slug}`;
  const validTable = (value?: string | null) => (value && restaurant.tables.includes(Number(value)) ? value : "");

  const [qty, setQty] = useState<Record<number, number>>({});
  const [table, setTable] = useState(validTable(initialTable));
  const [restored, setRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);

  // Keep the basket in sessionStorage so switching language (a new URL) or reloading doesn't empty it.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
      /* eslint-disable react-hooks/set-state-in-effect -- one-time restore after hydration */
      setQty(saved.qty ?? {});
      setTable((current) => current || validTable(saved.table));
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
    setRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ qty, table }));
    } catch {}
  }, [restored, qty, table, storageKey]);

  const itemsById = new Map<number, MenuItem>(categories.flatMap((c) => c.items.map((i) => [i.id, i] as const)));
  const lines = Object.entries(qty)
    .map(([id, quantity]) => ({ item: itemsById.get(Number(id)), quantity }))
    .filter((l): l is { item: MenuItem; quantity: number } => !!l.item?.is_available && l.quantity > 0);
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + l.item.price_cents * l.quantity, 0);
  const money = (cents: number) => formatMoney(cents, restaurant.currency, lang);
  const countLabel = (n: number) => fmt(plural(n, t.menu.items_one, t.menu.items_other, lang), { n });

  const change = (id: number, delta: number) =>
    setQty((q) => ({ ...q, [id]: Math.min(20, Math.max(0, (q[id] ?? 0) + delta)) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFailure(null);
    try {
      const order = await placeOrder(restaurant.slug, lang, {
        table_number: table ? Number(table) : null,
        items: lines.map((l) => ({ menu_item_id: l.item.id, quantity: l.quantity })),
      });
      setPlaced(order);
      setQty({});
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setErrors(err.errors);
      else setFailure(err instanceof ApiError && err.status === 0 ? t.menu.networkError : t.menu.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div role="status" className="rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-sage-soft text-sage-deep"><CheckIcon /></span>
          <h1 className="mt-5 font-display text-3xl font-semibold">{t.menu.confirmTitle}</h1>
          <p className="mt-2 text-xl font-medium">{fmt(t.menu.confirmNumber, { n: placed.number })}</p>
          <p className="mt-2 text-muted">{fmt(t.menu.confirmBody, { table: placed.table })}</p>
          <dl className="mt-6 divide-y divide-line rounded-lg border border-line text-left text-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-muted">{t.menu.confirmStatus}</dt>
              <dd><StatusBadge status={placed.status} label={t.status[placed.status]} /></dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <dt className="text-muted">{t.menu.confirmTotal}</dt>
              <dd className="font-semibold">{money(placed.total_cents)}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => setPlaced(null)} className="btn-primary">{t.menu.orderAgain}</button>
            <Link href={`/${lang}/dashboard/${restaurant.slug}`} className="btn-ghost">{t.menu.viewKitchen}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 sm:px-6 lg:pb-12">
      <div className="py-10">
        <h1 className="font-display text-4xl font-semibold tracking-tight">{restaurant.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-muted">{restaurant.description[lang]}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          <nav aria-label={t.menu.categories} className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-line bg-paper/95 px-4 backdrop-blur sm:mx-0 sm:px-0">
            <ul className="flex gap-2 py-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <a href={`#cat-${c.id}`} className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full border border-line bg-surface px-4 text-sm font-medium hover:bg-sand">
                    {c.name[lang]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {categories.map((c) => (
            <section key={c.id} id={`cat-${c.id}`} aria-labelledby={`cat-title-${c.id}`} className="pt-10">
              <h2 id={`cat-title-${c.id}`} className="font-display text-2xl font-semibold">{c.name[lang]}</h2>
              <ul className="mt-2 divide-y divide-line">
                {c.items.map((item) => {
                  const name = item.name[lang];
                  const n = qty[item.id] ?? 0;
                  return (
                    <li key={item.id} className="flex gap-4 py-5">
                      <div className={`min-w-0 flex-1 ${item.is_available ? "" : "text-muted"}`}>
                        <h3 className="font-medium">{name}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{item.description[lang]}</p>
                        <p className="mt-2 text-sm font-medium">{money(item.price_cents)}</p>
                      </div>
                      <div className="flex shrink-0 items-start">
                        {!item.is_available ? (
                          <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium text-muted">{t.menu.unavailable}</span>
                        ) : n === 0 ? (
                          <button type="button" onClick={() => change(item.id, 1)} aria-label={fmt(t.menu.addNamed, { name })} className="btn-ghost">
                            {t.menu.add}
                          </button>
                        ) : (
                          <Stepper
                            quantity={n}
                            onChange={(d) => change(item.id, d)}
                            labels={{ decrease: fmt(n === 1 ? t.menu.remove : t.menu.decrease, { name }), increase: fmt(t.menu.increase, { name }) }}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside id="basket" aria-labelledby="basket-title" className="lg:sticky lg:top-24 lg:self-start">
          <form onSubmit={submit} noValidate className="rounded-xl border border-line bg-surface p-5 shadow-sm">
            <h2 id="basket-title" className="font-display text-2xl font-semibold">{t.menu.basketTitle}</h2>

            <div className="mt-4">
              <label htmlFor="table" className="mb-1.5 block text-sm font-medium">{t.menu.table}</label>
              <select
                id="table"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                aria-invalid={!!errors.table_number}
                aria-describedby={errors.table_number ? "table-error" : undefined}
                className="field"
              >
                <option value="">{t.menu.chooseTable}</option>
                {restaurant.tables.map((n) => (
                  <option key={n} value={n}>{fmt(t.menu.tableN, { n })}</option>
                ))}
              </select>
              {errors.table_number && <p id="table-error" className="mt-1.5 text-sm text-terracotta-deep">{errors.table_number[0]}</p>}
            </div>

            {lines.length === 0 ? (
              <p className="mt-6 rounded-lg bg-sand px-4 py-6 text-center text-sm text-muted">{t.menu.basketEmpty}</p>
            ) : (
              <ul className="mt-5 divide-y divide-line">
                {lines.map(({ item, quantity }) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.name[lang]}</p>
                      <p className="text-sm text-muted">{money(item.price_cents * quantity)}</p>
                    </div>
                    <Stepper
                      quantity={quantity}
                      onChange={(d) => change(item.id, d)}
                      labels={{ decrease: fmt(quantity === 1 ? t.menu.remove : t.menu.decrease, { name: item.name[lang] }), increase: fmt(t.menu.increase, { name: item.name[lang] }) }}
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-sm text-muted">{t.menu.total}</span>
              <span className="text-xl font-semibold">{money(total)}</span>
            </div>

            {(failure || Object.keys(errors).some((k) => k !== "table_number")) && (
              <div role="alert" className="mt-4 rounded-lg bg-terracotta-soft px-4 py-3 text-sm text-terracotta-deep">
                {failure ?? Object.entries(errors).filter(([k]) => k !== "table_number").flatMap(([, m]) => m).map((m) => <p key={m}>{m}</p>)}
              </div>
            )}

            <button type="submit" disabled={submitting || lines.length === 0} className="btn-primary mt-5 w-full">
              {submitting ? t.menu.sending : t.menu.placeOrder}
            </button>
          </form>
        </aside>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur lg:hidden">
          <a href="#basket" className="btn-primary w-full justify-between">
            <span>{t.menu.viewOrder} · {countLabel(count)}</span>
            <span>{money(total)}</span>
          </a>
        </div>
      )}
    </div>
  );
}

function Stepper({ quantity, onChange, labels }: { quantity: number; onChange: (delta: number) => void; labels: { decrease: string; increase: string } }) {
  const btn = "flex size-11 items-center justify-center text-lg hover:bg-sand disabled:opacity-40";
  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface">
      <button type="button" onClick={() => onChange(-1)} aria-label={labels.decrease} className={`${btn} rounded-l-lg`}>−</button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">{quantity}</span>
      <button type="button" onClick={() => onChange(1)} disabled={quantity >= 20} aria-label={labels.increase} className={`${btn} rounded-r-lg`}>+</button>
    </div>
  );
}
