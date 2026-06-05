import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import logo from "@/assets/spice-market-logo.webp.asset.json";

const nav = [
  { to: "/shop", label: "Магазин", search: undefined },
  { to: "/shop", label: "Чисті спеції", search: { cat: "clean" } as const },
  { to: "/shop", label: "Суміші", search: { cat: "blend" } as const },
  { to: "/shop", label: "Чаї", search: { cat: "tea" } as const },
  { to: "/shop", label: "Подарунки", search: { cat: "gift" } as const },
  { to: "/about", label: "Бренд", search: undefined },
  { to: "/contact", label: "Контакти", search: undefined },
];

export function Header() {
  const { totalItems } = useCart();
  const [q, setQ] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-center px-4 py-2 text-xs tracking-wide">
          Безкоштовна доставка від 1 200 ₴ · Нова Пошта та InPost
        </div>
      </div>
      <div className="container mx-auto flex items-center gap-6 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo.url}
            alt="Spice Market"
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <span className="font-serif text-xl tracking-tight">Spice Market</span>
        </Link>

        <form
          className="ml-2 hidden flex-1 items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            window.location.href = `/shop?${params.toString()}`;
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Шукайте: паприка, для курки, чай..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 text-foreground/80">
          <button className="hidden rounded-sm p-2 hover:bg-secondary md:inline-flex" aria-label="Обране">
            <Heart className="h-5 w-5" />
          </button>
          <button className="hidden rounded-sm p-2 hover:bg-secondary md:inline-flex" aria-label="Кабінет">
            <User className="h-5 w-5" />
          </button>
          <Link to="/cart" className="relative rounded-sm p-2 hover:bg-secondary" aria-label="Кошик">
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      <nav className="border-t border-border/60">
        <div className="container mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 text-sm text-foreground/80 font-serif">
          {nav.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              search={n.search as never}
              className="transition-colors hover:text-accent"
              activeProps={{ className: "text-accent" }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}