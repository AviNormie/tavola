const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const MenuIcon = () => (
  <svg {...base}>
    <path d="M5 4h14M5 9h14M5 14h8M5 19h6" />
  </svg>
);

export const TableIcon = () => (
  <svg {...base}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M20 20h.01M17 20v.01" />
  </svg>
);

export const KitchenIcon = () => (
  <svg {...base}>
    <path d="M4 14h16M6 14a6 6 0 0 1 12 0M12 8V6M9 20h6" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
