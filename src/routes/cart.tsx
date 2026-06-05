import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { Minus, Plus, Trash2, ArrowRight, Truck } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Кошик — Spice Market" }] }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, subtotal, totalItems } = useCart();

  if (lines.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl">Кошик порожній</h1>
        <p className="mt-4 text-muted-foreground">Час обрати щось ароматне.</p>
        <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90">
          До магазину <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_360px]">
      <div>
        <h1 className="text-4xl mb-2">Кошик</h1>
        <p className="text-sm text-muted-foreground mb-8">{totalItems} {totalItems === 1 ? "позиція" : "позицій"}</p>
        <ul className="divide-y divide-border border-y border-border">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-4 py-5">
              <Link to="/product/$slug" params={{ slug: line.slug }} className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary">
                <img src={line.image} alt={line.name} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to="/product/$slug" params={{ slug: line.slug }} className="font-serif text-lg hover:text-accent">{line.name}</Link>
                    <div className="text-xs text-muted-foreground mt-1">
                      {[line.packLabel, line.weight].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <button onClick={() => remove(line.id)} className="text-muted-foreground hover:text-destructive" aria-label="Видалити">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="inline-flex items-center rounded-sm border border-border">
                    <button onClick={() => setQty(line.id, line.qty - 1)} className="p-2 hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm">{line.qty}</span>
                    <button onClick={() => setQty(line.id, line.qty + 1)} className="p-2 hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="font-serif text-lg">{line.price * line.qty} ₴</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-sm border border-border bg-card p-6 lg:sticky lg:top-32">
        <h2 className="font-serif text-2xl mb-5">Замовлення</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Товарів</span><span>{totalItems} шт.</span></div>
          <div className="border-t border-border pt-3 flex justify-between font-serif text-xl">
            <span>Разом за товари</span><span>{subtotal} ₴</span>
          </div>
          <div className="rounded-sm bg-secondary p-3 text-xs text-muted-foreground flex gap-2">
            <Truck className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Доставка оплачується окремо при отриманні посилки.</span>
          </div>
        </div>
        <Link to="/checkout" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent py-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
          Оформити замовлення <ArrowRight className="h-4 w-4" />
        </Link>
      </aside>
    </div>
  );
}
