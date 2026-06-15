import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useCart, type CartLine } from "@/lib/cart";
import { cartToOrderItems } from "@/lib/order-items";
import { Check, Copy, RefreshCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/order/$orderNumber")({
  head: () => ({
    meta: [{ title: "Замовлення прийнято — Spice Market" }, { name: "robots", content: "noindex" }],
  }),
  component: OrderConfirmation,
});

interface SavedOrder {
  orderNumber: string;
  lines: CartLine[];
}

function OrderConfirmation() {
  const { orderNumber } = Route.useParams();
  const cart = useCart();
  const [saved, setSaved] = useState<SavedOrder | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sm.lastOrder.v1");
      if (raw) setSaved(JSON.parse(raw));
    } catch {
      // Ignore unavailable or invalid last-order storage.
    }
  }, []);

  const items = useMemo(() => (saved ? cartToOrderItems(saved.lines) : []), [saved]);
  const total = items.reduce((s, i) => s + i.lineTotal, 0);

  function copyDetails() {
    const lines = [
      `Замовлення ${orderNumber}`,
      ``,
      `Товари:`,
      ...items.map(
        (i) =>
          `· ${i.name}${i.packLabel ? " — " + i.packLabel : ""}${i.weight ? " (" + i.weight + ")" : ""} ×${i.qty} = ${i.lineTotal} ₴`,
      ),
      ``,
      `Разом за товари: ${total} ₴`,
      `Доставка оплачується окремо при отриманні.`,
    ].join("\n");
    navigator.clipboard.writeText(lines).then(
      () => toast.success("Деталі скопійовано"),
      () => toast.error("Не вдалося скопіювати"),
    );
  }

  function repeatOrder() {
    if (!saved) return;
    cart.clear();
    saved.lines.forEach((l) =>
      cart.add({
        slug: l.slug,
        name: l.name,
        image: l.image,
        price: l.price,
        weight: l.weight,
        packLabel: l.packLabel,
        qty: l.qty,
      }),
    );
    toast.success("Товари знову у кошику");
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <span className="inline-grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground">
          <Check className="h-7 w-7" />
        </span>
        <h1 className="mt-6 text-4xl">Дякуємо, замовлення прийнято</h1>
        <p className="mt-3 text-muted-foreground">
          Номер замовлення: <span className="font-mono text-foreground">{orderNumber}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Менеджер звʼяжеться з вами найближчим часом для підтвердження та узгодження оплати.
        </p>
      </div>

      {items.length > 0 && (
        <div className="mt-10 rounded-sm border border-border bg-card p-6">
          <h2 className="font-serif text-2xl mb-4">Деталі замовлення</h2>
          <ul className="divide-y divide-border text-sm">
            {items.map((it, i) => (
              <li key={i} className="py-3">
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{it.name}</span>
                  <span>{it.lineTotal} ₴</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {it.packLabel}
                  {it.weight && ` · ${it.weight}`}
                  {` · ×${it.qty}`}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4 flex justify-between font-serif text-xl">
            <span>Разом за товари</span>
            <span>{total} ₴</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Доставка оплачується окремо при отриманні посилки.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              onClick={copyDetails}
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-border px-4 py-3 text-sm hover:border-accent"
            >
              <Copy className="h-4 w-4" /> Копіювати деталі для менеджера
            </button>
            <button
              onClick={repeatOrder}
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-3 text-sm text-accent-foreground hover:bg-accent/90"
            >
              <RefreshCcw className="h-4 w-4" /> Повторити замовлення
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          Продовжити покупки <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
