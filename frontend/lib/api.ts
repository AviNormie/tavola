import type { Locale, MenuCategory, Order, OrderStatus, Restaurant } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number, // 0 = the API could not be reached
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}

type Options = { method?: string; lang?: Locale; token?: string; body?: unknown };

async function request<T>(path: string, { method = "GET", lang, token, body }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (lang) headers["Accept-Language"] = lang;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(0, "Network error");
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new ApiError(res.status, json.message ?? res.statusText, json.errors);
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json();
  return "data" in json ? json.data : json;
}

const base = (slug: string) => `/restaurants/${encodeURIComponent(slug)}`;

export const getRestaurant = (slug: string) => request<Restaurant>(base(slug));
export const getMenu = (slug: string) => request<MenuCategory[]>(`${base(slug)}/menu`);

export const placeOrder = (slug: string, lang: Locale, body: { table_number: number | null; items: { menu_item_id: number; quantity: number }[] }) =>
  request<Order>(`${base(slug)}/orders`, { method: "POST", lang, body });

export const staffLogin = (slug: string, lang: Locale, body: { email: string; password: string }) =>
  request<{ token: string; name: string }>(`${base(slug)}/staff/login`, { method: "POST", lang, body });

export const staffLogout = (slug: string, token: string) =>
  request<void>(`${base(slug)}/staff/logout`, { method: "POST", token });

export const listOrders = (slug: string, token: string) => request<Order[]>(`${base(slug)}/orders`, { token });

export const updateOrderStatus = (slug: string, token: string, orderId: number, status: OrderStatus) =>
  request<Order>(`${base(slug)}/orders/${orderId}/status`, { method: "PATCH", token, body: { status } });
