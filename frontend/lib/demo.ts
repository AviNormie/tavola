import type { Localized } from "./types";

// The two seeded restaurants, linked from the landing page.
export const DEMO_RESTAURANTS: { slug: string; name: string; blurb: Localized; staffEmail: string }[] = [
  {
    slug: "trattoria-sole",
    name: "Trattoria Sole",
    blurb: { en: "Roman trattoria, Italian by default", it: "Trattoria romana, italiano di default" },
    staffEmail: "staff@trattoria-sole.test",
  },
  {
    slug: "north-pier-kitchen",
    name: "North Pier Kitchen",
    blurb: { en: "Seasonal British plates, English by default", it: "Cucina britannica di stagione, inglese di default" },
    staffEmail: "staff@north-pier.test",
  },
];

// Public demo password for the seeded staff accounts (see backend DatabaseSeeder).
export const DEMO_PASSWORD = "demo1234";
