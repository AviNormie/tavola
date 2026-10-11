export type Locale = "en" | "it";
export type Localized = Record<Locale, string>;
export type OrderStatus = "new" | "preparing" | "ready";

export type Restaurant = {
  name: string;
  slug: string;
  default_locale: Locale;
  currency: string;
  description: Localized;
  tables: number[];
};

export type MenuItem = {
  id: number;
  name: Localized;
  description: Localized;
  price_cents: number;
  is_available: boolean;
};

export type MenuCategory = {
  id: number;
  name: Localized;
  items: MenuItem[];
};

export type Order = {
  id: number;
  number: number;
  status: OrderStatus;
  table: number;
  total_cents: number;
  created_at: string;
  items: { quantity: number; unit_price_cents: number; name: Localized }[];
};
