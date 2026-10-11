import type { OrderStatus } from "@/lib/types";

const styles: Record<OrderStatus, string> = {
  new: "bg-terracotta-soft text-terracotta-deep",
  preparing: "bg-sand text-ink",
  ready: "bg-sage-soft text-sage-deep",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>{label}</span>;
}
