import type { CartLine } from "@/lib/cart";

export interface OrderItem {
  slug: string;
  name: string;
  packLabel?: string | null;
  weight?: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export function cartToOrderItems(lines: CartLine[]): OrderItem[] {
  return lines.map((l) => ({
    slug: l.slug,
    name: l.name,
    packLabel: l.packLabel ?? null,
    weight: l.weight ?? null,
    qty: l.qty,
    unitPrice: l.price,
    lineTotal: l.price * l.qty,
  }));
}
