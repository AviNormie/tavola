"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ApiError, listOrders, staffLogin, staffLogout, updateOrderStatus } from "@/lib/api";
import { DEMO_PASSWORD, DEMO_RESTAURANTS } from "@/lib/demo";
import { fmt, formatAgo, formatMoney, formatTime } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale, Order, OrderStatus, Restaurant } from "@/lib/types";
import { StatusBadge } from "./status-badge";

type Props = { restaurant: Restaurant; lang: Locale; t: Dictionary };

const POLL_MS = 10_000;
const COLUMNS: OrderStatus[] = ["new", "preparing", "ready"];
const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { new: "preparing", preparing: "ready" };

export function Dashboard(props: Props) {
  const tokenKey = `tavola:staff-token:${props.restaurant.slug}`;
  // undefined = still reading localStorage, null = signed out
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is only readable after hydration
    setToken(localStorage.getItem(tokenKey));
  }, [tokenKey]);

  const signedIn = (value: string) => {
    localStorage.setItem(tokenKey, value);
    setNotice(null);
    setToken(value);
  };
  const signedOut = (message: string | null = null) => {
    localStorage.removeItem(tokenKey);
    setNotice(message);
    setToken(null);
  };

  if (token === undefined) return <p className="mx-auto max-w-6xl px-4 py-16 text-muted sm:px-6">{props.t.dashboard.loading}</p>;
  if (!token) return <StaffLogin {...props} notice={notice} onSignedIn={signedIn} />;
  return <Orders {...props} token={token} onSignedOut={signedOut} />;
}

function StaffLogin({ restaurant, lang, t, notice, onSignedIn }: Props & { notice: string | null; onSignedIn: (token: string) => void }) {
  const demoEmail = DEMO_RESTAURANTS.find((r) => r.slug === restaurant.slug)?.staffEmail ?? "";
  const [email, setEmail] = useState(demoEmail);
  const [password, setPassword] = useState(demoEmail ? DEMO_PASSWORD : "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn((await staffLogin(restaurant.slug, lang, { email, password })).token);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? Object.values(err.errors).flat()[0] ?? err.message : t.menu.genericError);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-medium">{t.dashboard.demoBadge}</span>
        <h1 className="mt-4 font-display text-3xl font-semibold">{t.dashboard.loginTitle}</h1>
        <p className="mt-2 text-muted">{fmt(t.dashboard.loginText, { name: restaurant.name })}</p>
        <p className="mt-4 rounded-lg bg-sage-soft px-4 py-3 text-sm text-sage-deep">{t.dashboard.demoNotice}</p>

        {(notice || error) && <p role="alert" className="mt-4 rounded-lg bg-terracotta-soft px-4 py-3 text-sm text-terracotta-deep">{error ?? notice}</p>}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">{t.dashboard.email}</label>
            <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">{t.dashboard.password}</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? t.dashboard.signingIn : t.dashboard.signIn}</button>
        </form>
      </div>
    </div>
  );
}

function Orders({ restaurant, lang, t, token, onSignedOut }: Props & { token: string; onSignedOut: (message?: string | null) => void }) {
  const slug = restaurant.slug;
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [updateFailed, setUpdateFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleAuth = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        onSignedOut(t.dashboard.sessionExpired);
        return true;
      }
      return false;
    },
    [onSignedOut, t.dashboard.sessionExpired],
  );

  const load = useCallback(async () => {
    try {
      setOrders(await listOrders(slug, token));
      setLoadFailed(false);
    } catch (err) {
      if (!handleAuth(err)) setLoadFailed(true);
    }
  }, [slug, token, handleAuth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch, then poll
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function advance(order: Order) {
    const next = NEXT[order.status];
    if (!next) return;
    setBusyId(order.id);
    setUpdateFailed(false);
    try {
      const updated = await updateOrderStatus(slug, token, order.id, next);
      setOrders((list) => list?.map((o) => (o.id === updated.id ? updated : o)) ?? null);
    } catch (err) {
      if (!handleAuth(err)) setUpdateFailed(true);
    } finally {
      setBusyId(null);
    }
  }

  async function signOut() {
    await staffLogout(slug, token).catch(() => {});
    onSignedOut();
  }

  const byStatus = (status: OrderStatus) => {
    const list = (orders ?? []).filter((o) => o.status === status);
    // Kitchen works oldest-first; finished orders show newest-first.
    return list.sort((a, b) => (status === "ready" ? -1 : 1) * (Date.parse(a.created_at) - Date.parse(b.created_at)));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{t.dashboard.title}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight">{restaurant.name}</h1>
          <p className="mt-2 text-sm text-muted">{t.dashboard.live}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/${lang}/r/${slug}`} className="btn-ghost">{t.dashboard.viewMenu}</Link>
          <button type="button" onClick={load} className="btn-ghost">{t.dashboard.refresh}</button>
          <button type="button" onClick={signOut} className="btn-ghost">{t.dashboard.signOut}</button>
        </div>
      </div>

      <div aria-live="polite">
        {(loadFailed || updateFailed) && (
          <p role="alert" className="mt-6 rounded-lg bg-terracotta-soft px-4 py-3 text-sm text-terracotta-deep">
            {updateFailed ? t.dashboard.updateError : t.dashboard.loadError}
          </p>
        )}
      </div>

      {orders === null ? (
        <p className="mt-10 text-muted">{loadFailed ? "" : t.dashboard.loading}</p>
      ) : orders.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
          <h2 className="font-display text-2xl font-semibold">{t.dashboard.emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">{t.dashboard.emptyText}</p>
          <Link href={`/${lang}/r/${slug}`} className="btn-primary mt-6">{t.dashboard.viewMenu}</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {COLUMNS.map((status) => {
            const list = byStatus(status);
            return (
              <section key={status} aria-labelledby={`col-${status}`}>
                <h2 id={`col-${status}`} className="mb-3 flex items-center justify-between border-b border-line pb-3 font-medium">
                  {t.status[status]}
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-sm tabular-nums">{list.length}</span>
                </h2>
                {list.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-muted">{t.dashboard.columnEmpty}</p>
                ) : (
                  <ul className="space-y-3">
                    {list.map((order) => (
                      <OrderCard key={order.id} order={order} restaurant={restaurant} lang={lang} t={t} busy={busyId === order.id} onAdvance={() => advance(order)} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, restaurant, lang, t, busy, onAdvance }: { order: Order; restaurant: Restaurant; lang: Locale; t: Dictionary; busy: boolean; onAdvance: () => void }) {
  const next = NEXT[order.status];
  return (
    <li className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">#{order.number} · {fmt(t.dashboard.tableN, { n: order.table })}</p>
          <p className="text-sm text-muted">{formatTime(order.created_at, lang)} · {formatAgo(order.created_at, lang)}</p>
        </div>
        <StatusBadge status={order.status} label={t.status[order.status]} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {order.items.map((line, i) => (
          <li key={i}>{line.quantity}× {line.name[lang]}</li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="font-semibold">{formatMoney(order.total_cents, restaurant.currency, lang)}</span>
        {next && (
          <button type="button" onClick={onAdvance} disabled={busy} className={next === "ready" ? "btn-sage" : "btn-primary"}>
            {next === "ready" ? t.dashboard.markReady : t.dashboard.startPreparing}
            <span className="sr-only"> #{order.number}</span>
          </button>
        )}
      </div>
    </li>
  );
}
