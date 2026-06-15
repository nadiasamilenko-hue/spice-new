import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface CartLine {
  id: string; // slug
  slug: string;
  name: string;
  image: string;
  price: number;
  weight?: string | null;
  packLabel?: string | null;
  qty: number;
}

interface CartCtx {
  lines: CartLine[];
  add: (line: Omit<CartLine, "id" | "qty"> & { qty?: number }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  totalItems: number;
  subtotal: number;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "sm.cart.v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // Ignore unavailable or invalid local cart storage.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      add: ({ slug, name, image, price, weight, packLabel, qty = 1 }) => {
        setLines((prev) => {
          const id = `${slug}::${weight ?? ""}`;
          const existing = prev.find((l) => l.id === id);
          if (existing) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l));
          return [...prev, { id, slug, name, image, price, weight, packLabel, qty }];
        });
      },
      setQty: (id, qty) =>
        setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))),
      remove: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      clear: () => setLines([]),
      totalItems: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0),
    }),
    [lines],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
